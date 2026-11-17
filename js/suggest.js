/* Suggest — validated personal places, processed optional photos, private catalog storage. */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const form = document.getElementById("suggest-form");
  const fields = Object.fromEntries([...form.querySelectorAll("input,select,textarea")].map(el=>[el.id,el]));
  const inputs = Object.values(fields);
  const status = document.getElementById("suggest-success");
  const photo = fields["spot-photo"];
  const preview = document.getElementById("spot-photo-preview");
  const previewImg = document.getElementById("spot-photo-preview-img");
  const submitButton = form.querySelector('button[type="submit"]');
  let cachedPhoto = "";
  let photoError = "";
  const items = () => NS.get("suggestions", []);
  function errorFor(input) {
    const value = (input.value||"").trim();
    switch(input.id) {
      case "visitor-name": return !value ? "Please enter your name." : value.length<2 || value.length>60 || /\d/.test(value) ? "Use 2–60 letters, without numbers." : "";
      case "email": return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? "Enter a valid email address." : "";
      case "spot-name": return value.length<2 || value.length>80 ? "Enter a place name (2–80 characters)." : "";
      case "category": return ["slow","social","outside"].includes(value) ? "" : "Choose a category.";
      case "spot-budget": return value==="" || !Number.isFinite(Number(value)) || +value<0 || +value>50000 ? "Enter a price between ₸0 and ₸50,000." : "";
      case "spot-minutes": return value==="" || !Number.isInteger(+value) || +value<15 || +value>360 ? "Enter 15–360 minutes." : "";
      case "spot-address": return value.length>120 ? "Keep the address under 120 characters." : "";
      case "spot-photo": return photoError || (input.files && input.files[0] && !["image/jpeg","image/png","image/webp"].includes(input.files[0].type) ? "Please use JPG, PNG or WebP." : "");
      case "reason": return value.length<20 ? "Write at least 20 characters." : value.length>500 ? "Use at most 500 characters." : "";
      default: return "";
    }
  }
  const validate = el => NS.setFieldState(el,errorFor(el));
  function prefill() {
    const user=NS.currentUser();
    if(user) { fields["visitor-name"].value=user.name; fields.email.value=user.email; }
  }
  function renderSaved() {
    const list=document.getElementById("suggestions-list"); list.replaceChildren();
    const saved=items();
    if(!saved.length) { const p=document.createElement("p");p.className="suggestion-empty";p.textContent="No personal places yet. Add one above and then open Explore or Plan."; list.append(p); return; }
    saved.forEach((item,index)=>{
      const card=document.createElement("article");card.className="suggestion-item";
      const line=document.createElement("div");line.className="suggestion-line";
      if(item.photoData) {const image=document.createElement("img");image.src=item.photoData;image.alt="Your uploaded photo of "+item.name;line.append(image);}
      const content=document.createElement("div");
      const meta=document.createElement("small");meta.textContent=NS.categoryName(item.category).toUpperCase()+" · "+NS.money(Number(item.budget)||0)+" · "+(item.minutes||60)+" min";
      const title=document.createElement("h3");title.textContent=item.name;
      const desc=document.createElement("p");desc.textContent=item.reason;
      content.append(meta,title,desc); line.append(content);
      const actions=document.createElement("div");actions.className="suggestion-actions";
      const explore=document.createElement("a");explore.href="explore.html?search="+encodeURIComponent(item.name); explore.textContent="View in Explore";explore.className="mini-btn";
      const plan=document.createElement("a");plan.href="compare.html?add="+encodeURIComponent(item.id||"personal-legacy-"+index); plan.textContent="Add to Plan";plan.className="mini-btn";
      const remove=document.createElement("button");remove.type="button";remove.className="mini-btn";remove.textContent="Delete";
      remove.setAttribute("aria-label","Delete "+item.name);
      remove.addEventListener("click",()=>{
        const updated=items().filter((x,i)=>x.id!==item.id || (!item.id && i!==index));
        if(!NS.set("suggestions",updated)) {NS.toast("Cannot remove the place: storage is unavailable.",{type:"error"});return;}
        NS.set("favorites",NS.get("favorites",[]).filter(id=>id!==item.id));
        NS.set("draft",NS.get("draft",[]).filter(id=>id!==item.id));
        renderSaved(); NS.toast("Personal place deleted.",{type:"info"});
      });
      actions.append(explore,plan,remove);card.append(line,actions);list.append(card);
    });
  }
  async function processCurrentPhoto() {
    cachedPhoto=""; photoError="";preview.hidden=true;
    const file=photo.files&&photo.files[0];
    if(file) try {cachedPhoto=await NS.processPhoto(file);previewImg.src=cachedPhoto;preview.hidden=false;}
    catch(e) {photoError=e.message||"Cannot open this image.";}
    validate(photo);
  }
  photo.addEventListener("change",()=>{processCurrentPhoto();});
  inputs.filter(el=>el!==photo).forEach(input=>{
    input.addEventListener("blur",()=>validate(input));
    input.addEventListener("input",()=>{if(input.classList.contains("is-invalid")||input.classList.contains("is-valid"))validate(input);if(input.id==="reason") document.getElementById("reason-count").textContent=input.value.length;});
    input.addEventListener("change",()=>{if(input.classList.contains("is-invalid")||input.classList.contains("is-valid"))validate(input);});
  });
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    submitButton.disabled=true;
    try {
      // Finish processing before saving, even if user submitted while the photo was decoding.
      if(photo.files&&photo.files.length&&!cachedPhoto&&!photoError) await processCurrentPhoto();
      const invalid=inputs.filter(el=>!validate(el));
      if(invalid.length) {status.hidden=true; NS.toastFormErrors(form,invalid);invalid[0].focus();return;}
      const spot={id:"personal-"+Date.now()+"-"+Math.random().toString(36).slice(2,8), name:fields["spot-name"].value.trim(),category:fields.category.value,
        budget:Number(fields["spot-budget"].value),minutes:Number(fields["spot-minutes"].value),address:fields["spot-address"].value.trim().slice(0,120),
        reason:fields.reason.value.trim().slice(0,500),photoData:cachedPhoto,createdAt:new Date().toISOString()};
      if(!NS.set("suggestions",[spot,...items()].slice(0,5))) {status.hidden=false;status.classList.add("error");status.textContent="Browser storage is full or unavailable. Your place was not saved. Try a smaller photo.";NS.toast(status.textContent,{type:"error"});return;}
      form.reset();NS.clearFieldStates(form);cachedPhoto="";photoError="";preview.hidden=true; previewImg.removeAttribute("src");document.getElementById("reason-count").textContent="0";prefill();renderSaved();
      status.classList.remove("error");status.textContent="Saved! Your personal place is now available in Explore and Plan on this browser.";NS.reveal(status,260);
      NS.toast("Your place is ready in Explore and Plan.",{title:"Personal place saved",link:{href:"explore.html?category=mine",text:"See my place"}});
    } finally {submitButton.disabled=false;}
  });
  document.getElementById("clear-suggestions").addEventListener("click",()=>{
    const ids=items().map(x=>x.id);
    if(!NS.set("suggestions",[])){NS.toast("Unable to clear places.",{type:"error"});return;}
    NS.set("favorites",NS.get("favorites",[]).filter(id=>!ids.includes(id)));
    NS.set("draft",NS.get("draft",[]).filter(id=>!ids.includes(id)));
    renderSaved();status.hidden=true;NS.toast("Your personal places were cleared.",{type:"info"});
  });
  document.getElementById("tips-toggle").addEventListener("click",event=>{
    const button=event.currentTarget,panel=document.getElementById("tips-content"),closing=button.getAttribute("aria-expanded")==="true";
    button.setAttribute("aria-expanded",String(!closing));
    if(closing)$(panel).stop(true,true).slideUp(200,()=>panel.hidden=true);
    else{panel.hidden=false;$(panel).stop(true,true).hide().slideDown(220);}
  });
  prefill(); renderSaved();
});

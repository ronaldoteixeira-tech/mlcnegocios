async function refreshCart(context=null){const options=context==null?{}:{context:_dom(context).matchObject()}
if(options.context.cart){window.__cart=options.context.cart}else{options.context.cart=window.__cart}
const elements=['header/go to cart','cart/empty','cart/header','cart/item list','cart/totals','cart/coupon search','cart page/item list','cart page/delivery search results','cart page/coupon search','cart page/totals','cart page/empty','checkout/cart-products','checkout/cart-footer','checkout/clube a']
await _refresh(elements,options);_dom('window._user').waitVariable(function(){options.context.user=window._user;_refresh(elements,options)})}
window.$increazyOnCloseCheckout=function(message){if(message=='payment-finished'){_cookie('cart_id').erase();getCart()}};async function getCart(){loading('cart-page','on');loading('cart','on');const currentUrl=new URL(window.location.href);const idUrl=currentUrl.searchParams.get("cart");await _ecommerce('cart/getOrCreate',{isOffline:!0,body:{id:idUrl||_cookie('cart_id').read(),},success:async function(cart,isOffline){if(!isOffline){_cookie('cart_id').write(cart?.id||'')}
await refreshCart({cart});if(isOffline===!1&&cart?.id){await removePixPaymentMethodInCart(cart.id)}
loading('address-checkout-element','off')
loading('profile-checkout-element','off')}});loading('cart','off');loading('cart-page','off')}
async function fakeCart(){loading('cart-page','on');await refreshCart({cart:{items:[],totals:{subtotal:0,total:0,freigth:0,discount:0,},items_count:0,count:0,}});loading('cart-page','off')}(function(){const currentUrl=new URL(window.location.href);const idUrl=currentUrl.searchParams.get("cart");if(idUrl||_cookie('cart_id').read()){getCart()}else{fakeCart()}})();function shareCart(){try{const cart_id=window.__cart.id;const url=`${window.location.origin}/carrinho/?cart=${cart_id}`;var input=document.createElement("input");input.setAttribute("type","text");input.setAttribute("value",url);document.body.appendChild(input);input.select();if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){navigator.clipboard.writeText(input.value).then(()=>{toast('URL do carrinho copiada com sucesso!','green')}).catch((err)=>{toast('Por algum motivo não conseguimos copiar a URL, tente copiar manualmente','yellow')})}else{const successful=document.execCommand("copy");const msg=successful?"URL do carrinho copiada com sucesso!":"Por algum motivo não conseguimos copiar a URL, tente copiar manualmente";toast(msg,successful?'green':'yellow')}
document.body.removeChild(input)}catch(error){console.error("Erro ao compartilhar carrinho:",error)}}
async function removePixPaymentMethodInCart(cartId){const secureId=cartId||window.__cart?.id||_cookie('cart_id').read();const minicart=document.querySelector('.cart__footer');const cartpage=document.querySelector('.cart-page__totals-column');if(minicart)loading('cart-footer-loading','on');if(cartpage)loading('cart-page-totals-loading','on');await _ecommerce('cart/setMethod',{body:{id:secureId,type:"creditcard"},success:async function(cart){refreshCart({cart})}});if(minicart)loading('cart-footer-loading','off');if(cartpage)loading('cart-page-totals-loading','off');}
function cepMask(el){var re=/^([\d]{2})\.*([\d]{3})-*([\d]{3})/;let cep=el.target||el
cep.value=cep.value.replace(/\D+/g,'');if(re.test(cep.value)){cep.value=cep.value.substring(0,8)
cep.value=cep.value.replace(re,"$1.$2-$3")}}
function toggleCart(status=!0){const cartOverlay=document.querySelector('.cart__overlay');const cartContainer=document.querySelector('.cart');const html=document.documentElement;if(status==!1){cartOverlay.classList.remove('active');cartContainer.classList.remove('active');html.classList.remove('menu-open');return}
cartOverlay.classList.toggle('active');cartContainer.classList.toggle('active');html.classList.toggle('menu-open')}
function changeQuantityByProduct(product,increment,origin=null){const input=document.querySelector(`input[data-product-quantity="${product.sku}"]`);if(input){const newQuantity=(+input.value)+increment;if(origin==='checkout'&&window.__cart?.items?.length===1&&newQuantity<=0){toast('Para esvaziar sua cesta de compras completamente, volte à loja.','yellow');return}
input.value=newQuantity;updateItem(product,newQuantity,origin)}}
async function updateItem(product,quantity,origin=null){const input=document.querySelector(`input[data-product-quantity="${product.sku}"]`);const previousValue=input?+input.defaultValue||+input.getAttribute('value')||+input.value:1;if(origin==='checkout'&&window.__cart?.items?.length===1&&quantity<=0){toast('Para esvaziar sua cesta de compras completamente, volte à loja.','yellow');if(input){input.value=previousValue}
return}
if(quantity<input.getAttribute('min')){input.value=input.getAttribute('min');toast('A quantidade mínima para compra é '+input.getAttribute('min')+'.','yellow');return}
loading('cart','on')
await _ecommerce('cart/changeItem',{isOffline:!0,body:{product,quantity},async success(cart,isOffline){await refreshCart({cart});if(isOffline){toast('Produto atualizado','green')}
loading('cart','off')},})}
async function removeItem(product){loading('cart','on')
try{_ecommerce('cart/removeItem',{isOffline:!0,body:{product},async success(cart,isOffline){await refreshCart({cart});if(isOffline){toast('Produto removido','green')}
loading('cart','off')}})}catch(error){toast('Falha ao remover o produto','red')}finally{loading('cart','off')}}
async function removeCheckoutItem(product){if(window.__cart?.items?.length<=1){toast('Para esvaziar sua cesta de compras completamente, volte à loja.','yellow');return}
loading('cart','on')
try{await _ecommerce('cart/removeItem',{isOffline:!0,body:{product},async success(cart,isOffline){await refreshCart({cart});if(isOffline){toast('Produto removido','green')}
loading('cart','off')},})}catch(error){toast('Falha ao remover o produto','red')}finally{loading('cart','off')}}
function formatCartObject(obj){const formattedObj={};for(const key in obj){if(key.includes("[")){const keys=key.split(/[\[\]]/).filter(Boolean);let currentObj=formattedObj;for(let i=0;i<keys.length-1;i++){const currentKey=keys[i];if(!currentObj[currentKey]){currentObj[currentKey]={}}
currentObj=currentObj[currentKey]}
const lastKey=keys[keys.length-1];currentObj[lastKey]=obj[key]}else{formattedObj[key]=obj[key]}}
return formattedObj}
async function addToCart(event,product,id=null){if(event.preventDefault){event.preventDefault();event.stopPropagation()}
const cartElement=document.querySelector('.cart');if(!cartElement.classList.contains('active')){toggleCart()}
const byShipping=id!=null;if(id==null){id=_cookie('cart_id').read()}
const formData=new FormData(event.target);let object=formatCartObject(Object.fromEntries(formData.entries()));const quantity=object.quantity?object.quantity:1;delete object.quantity
console.log('object:',object);console.log('keys:',Object.keys(object));const super_attribute=getProductVariations(object);const options=getProductOptions(object);const cart=await _ecommerce('cart/addItem',{isOffline:!byShipping,body:{id,product:{...product,sku:object.sku,super_attribute,options,request_info:object},quantity,},async success(cart,isOffline){if(!byShipping){await refreshCart({cart});if(isOffline){toast('Produto adicionado à sacola','green')}}
loading('cart','off')}})
return cart}
function getProductVariations(object){if(object.variations&&typeof object.variations==='object'){return object.variations}
return Object.keys(object).reduce((obj,name)=>{if(name.startsWith('variations.')){obj[name.replace('variations.','')]=object[name]}
return obj},{})}
function getProductOptions(object){return Object.keys(object).reduce((obj,name)=>{if(name.startsWith('options.')&&object[name]!=''){obj[name.replace('options.','')]=object[name]}
return obj},{})}
function goToCheckout(){var document=window._user?.cpf||'';if(document!=''&&document!=null){window.location.href='/checkout/address'}else{if(window._user?.email){window.location.href='/checkout/profile'}else{window.location.href='/checkout/verify'}}}
async function toggleCoupon(event){event.stopPropagation();event.preventDefault();loading('coupon','on')
const action=document.getElementById('coupon_action').value;const method=action=='add'?'addCoupon':'removeCoupon';const cart=await _ecommerce(`cart/${method}`,{body:{coupon:'_dom:#coupon$value'}})
await refreshCart({cart});const isCheckout=window.location.pathname.includes('checkout');if(isCheckout&&typeof searchInstallments==='function'){await searchInstallments()}
const message=action=='add'?'Cupom adicionado':'Cupom removido';toast(message,'green');loading('coupon','off')}
async function toggleCouponPage(event){event.stopPropagation();event.preventDefault();loading('coupon','on')
const action=document.getElementById('coupon_action-page').value;const method=action=='add'?'addCoupon':'removeCoupon';const cart=await _ecommerce(`cart/${method}`,{body:{coupon:'_dom:#coupon-page$value'}})
await refreshCart({cart});const message=action=='add'?'Cupom adicionado':'Cupom removido';toast(message,'green');loading('coupon','off')}
function getProductDataFromForm(form){return JSON.parse(form.dataset.product)}
async function submitGroupBuy(event){event.preventDefault();event.stopPropagation();loading('group-buy','on');const cartId=_cookie('cart_id').read();const mainForm=document.getElementsByName('form-product-one')[0];const crossForms=[...document.querySelectorAll('.groupbuy__crosssell .groupbuy__form')].filter(form=>{const checkbox=form.querySelector('.groupbuy__checkbox-input');return checkbox&&checkbox.checked});const forms=[mainForm,...crossForms].filter(Boolean);if(forms.length===0){toast('Selecione ao menos um produto para continuar','red');loading('group-buy','off');return}
const results=await Promise.allSettled(forms.map((form)=>{const formData=new FormData(form);const object=formatCartObject(Object.fromEntries(formData.entries()));const quantity=+object.quantity;delete object.quantity;const super_attribute=getProductVariations(object);const options=getProductOptions(object);const productData=getProductDataFromForm(form);return _ecommerce('cart/addItem',{body:{id:cartId,product:{...productData,sku:object.sku,super_attribute,options,request_info:object},quantity}})}));const succeeded=results.filter(r=>r.status==='fulfilled').length;if(succeeded===forms.length){toast('Produtos adicionados ao carrinho','green')}else if(succeeded>0){toast('Apenas alguns produtos foram adicionados ao carrinho','yellow')}else{toast('Não foi possível adicionar os produtos ao carrinho','red')}
if(succeeded>0){await getCart()}
loading('group-buy','off')}
async function cleanCart(){loading('cart','on');loading('cart-page','on');_cookie('cart_id').erase();window.__cart={}
_offlineCart('clear').clear();await refreshCart({});await getCart();loading('cart','off');loading('cart-page','off')}
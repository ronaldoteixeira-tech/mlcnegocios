async function getUser(){if(_cookie('user_token').read()){try{loading('account-page','on');loading('header-account','on');const response=await _ecommerce('auth/get',{body:{cartId:_cookie('cart_id').read()||null,}});window._user=response.customer;await _refresh(['header/go to account','header/go to favorites','product page/nostock modal'],{context:{user:response.customer}});const userGroup=_cookie('customer_group').read();_cookie('customer_id').write(response.customer.id);_cookie('customer_group').write(response.customer.group);if(!userGroup){return window.location.reload()}
await getUserAddress();if(window._user?.email){if(typeof onGetUserSuccess=='function'){onGetUserSuccess(window._user)}}
getWishlist()}catch(error){window.__wishlist=[];if(typeof onGetUserError=='function'){onGetUserError(error)}}finally{loading('account-page','off');loading('header-account','off');loading('profile-checkout-element','off')}}
if(!_cookie('user_token').read()){if(typeof onGetUserError=='function'){onGetUserError('')}}}
getUser();async function onLogin(origin){if(origin=='checkout')return;if(Object.keys(window._user||{}).length<=0){await getUser()}
_refresh(['header/go to account','header/go to favorites','product page/nostock modal'],{context:{user:window._user}});getUserAddress();getWishlist()}
async function onLogout(origin=null){_cookie('user_token').erase();_cookie('customer_id').erase();_cookie('customer_group').erase();if(origin=='checkout')return;if(window.automaticUpdatePricesByGroup){return setTimeout(function(){window.location.reload()},700)}
window.__wishlist=[];window._user={}
updateFavoriteIcons();_refresh(['header/go to account','header/go to favorites','product page/nostock modal'],{context:{}});getCart();_href('/account/verify')}
function validateWhatsapp(input){const value=input.value.replace(/\D/g,'')
if(!value){_clearInputError('whatsapp')
return}}
function formatarCpfCnpj(valor){const apenasNumeros=/^\d+$/.test(valor);if(!apenasNumeros){return valor}
if(valor.length===11){return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4")}else if(valor.length===14){return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,"$1.$2.$3/$4-$5")}
return valor}
function beforeAccountVerify(){loading('form-button','on')}
function afterAccountVerifySuccess(){loading('form-button','off')}
function afterAccountVerifyError(e){loading('form-button','off')}
function beforeAccountRegisterOrUpdate(){loading('form-button','on')}
async function afterAccountRegisterOrUpdateSuccess(data){if(data.endpoint=='register'){_resendToken({},null,data.user?.email);_href('/account/login');toast('Cadastro feito com sucesso','green');loading('form-button','off')}else if(data.endpoint=='update'){_dom('window._user').waitVariable(function(){_refresh(['blocks/account/form-profile'],{context:{user:{...window._user,cpf:formatarCpfCnpj(window._user.cpf||''),cnpj:formatarCpfCnpj(window._user.cnpj||'')}}})
setTimeout(()=>{viewOnlyForm()
const editBtn=document.querySelector('.accountprofile__edit');editBtn.style.display="flex"},1500)})
loading('form-button','off');toast('Perfil atualizado','green')}}
function afterAccountRegisterOrUpdateError(e){loading('form-button','off');toast(e,'yellow');viewOnlyForm()}
function beforeAccountLogin(){loading('form-button','on')}
function afterAccountLoginSuccess(data){const redirect=_cookie('redirect').read();if(redirect){const productIdInCookies=_cookie('warnme-product-id').read();_cookie('redirect').erase()
setTimeout(function(){_href(redirect)},700);if(productIdInCookies){setTimeout(function(){toggleNoStockModal(!0,productIdInCookies)},1400);setTimeout(function(){_cookie('warnme-product-id').erase()},3000)}}
loading('form-button','off');if(Object.keys(data.cart||{}).length>0){refreshCart({cart:data.cart})}
toast(`Bem-vindo, ${data.user?.firstname}.`,'green')}
function afterAccountLoginError(e){loading('form-button','off');toast(e,'yellow');const errorMessage=document.getElementById('token-input-error');errorMessage.classList.add('active')}
function beforeResendToken(){const resendLoading=document.querySelector('.resend-token__loading');if(resendLoading)resendLoading.style.display="inline-block"}
function afterResendTokenSuccess(){const resendLoading=document.querySelector('.resend-token__loading');if(resendLoading)resendLoading.style.display="none"}
function afterResendTokenError(e){toast(e,'yellow');const resendLoading=document.querySelector('.resend-token__loading');resendLoading.style.display="none"}
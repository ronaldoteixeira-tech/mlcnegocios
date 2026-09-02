window._addresElements=['account/address-list','checkout/address-list','checkout/address-action','blocks/checkout/form-address'];function beforeCreateAddress(){loading('form-button','on')}
function afterCreateAddressSuccess(){loading('form-button','off');toast('Endereço adicionado','green');getUserAddress();toggleFormAddress()}
function afterCreateAddressError(e){loading('form-button','off');toast('Erro ao cadastrar o endereço, tente novamente.','red')}
async function getState(state){try{const response=await axios.get(`https://api.increazy.com/apps/${_pwaSettings.checkout_id}
      }/state/${state}`);const{data}=response;if(document.querySelector('input[name=state]')){document.querySelector('input[name=state]').value=data?.name||''}
return data?.name||''}catch(e){console.log("[getState]")}}
async function getUserAddress(){try{loading('account-page','on');if((window._allAddress||[]).length<=0){let payload={customer:{id:window._user.id}}
const response=(await _ecommerce('address/list',{body:{...payload}}))
window._allAddress=response}
await _refresh(window._addresElements,{context:{addresses:[...window._allAddress]}})}catch(e){console.log('[getUserAddress]',e)}finally{loading('account-page','off');loading('address-checkout-element','off');const addressForm=document.getElementById('form-checkout-address');if(addressForm){const profilePhone=addressForm.querySelector('#phone');if(profilePhone)profilePhone.value=window._user.whatsapp||''}
if(window._allAddress&&(window._allAddress||[]).length<1&&(_cookie('user_token').read()||'').includes('wtp')){popupConfirmationOpenModal('Vimos que você ainda não tem um endereço cadastrado. Para cadastrar um novo endereço, é necessário fazer login na sua conta.',!0)}}}
async function removeAddress(id){let payload={address:{id}};try{loading('account-page','on');loading(`address-checkout-list-${id}`,'on');const response=(await _ecommerce('address/remove',{body:{...payload}}))
window._allAddress=response;await _refresh(window._addresElements,{context:{addresses:{...window._allAddress}}});toast('Endereço removido','green')}catch(e){console.log(e)}finally{loading('account-page','off');loading(`address-checkout-list-${id}`,'off')}}
async function editAddress(id){const address=window._allAddress.find(item=>item.id===id);if(Object.keys(address||{}).length>0){await _refresh(['blocks/account/form-address'],{context:{address}})
toggleFormAddress()}}
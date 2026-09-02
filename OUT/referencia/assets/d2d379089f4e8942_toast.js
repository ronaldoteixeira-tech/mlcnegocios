const ToastManager={toasts:[],container:null,init(){if(!this.container){this.container=document.createElement('div');this.container.id='toast-container';document.body.appendChild(this.container);if(!document.getElementById('toast-container-styles')){const style=document.createElement('style');style.id='toast-container-styles';style.textContent=`
          #toast-container {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column-reverse;
            gap: 10px;
            pointer-events: none;
          }
          
          .toast-item {
            position: relative;
            border-radius: 5px;
            box-shadow: 4px 5px 15px -5px #00000029;
            display: flex;
            align-items: center;
            padding: 0px 0px 0px 20px;
            min-height: 55px;
            transition: all 0.3s ease;
            transform: translateX(-120%);
            opacity: 0;
            pointer-events: all;
            max-width: 400px;
          }
          
          .toast-item.show {
            transform: translateX(0);
            opacity: 1;
          }
          
          .toast-item.hide {
            transform: translateX(-120%);
            opacity: 0;
          }
          
          .toast-item[data-color="blue"] {
            background-color: #dbeafe;
          }
          
          .toast-item[data-color="blue"] p {
            color: #1e40af;
          }
          
          .toast-item[data-color="green"] {
            background-color: #d1fae5;
          }
          
          .toast-item[data-color="green"] p {
            color: #065f46;
          }
          
          .toast-item[data-color="yellow"] {
            background-color: #fef3c7;
          }
          
          .toast-item[data-color="yellow"] p {
            color: #92400e;
          }
          
          .toast-item[data-color="red"] {
            background-color: #fee2e2;
          }
          
          .toast-item[data-color="red"] p {
            color: #991b1b;
          }
          
          .toast-item[data-color="default"] {
            background-color: #e5e7eb;
          }
          
          .toast-item[data-color="default"] p {
            color: #1f2937;
          }
          
          .toast-item p {
            font-size: 14px;
            margin: 0;
            flex: 1;
            font-weight: 400;
          }
          
          .toast-item span {
            padding: 0px 20px;
            cursor: pointer;
            font-size: 12px;
            font-family: var(--site-font);
            user-select: none;
            margin-left: 10px;
            opacity: 0.6;
            transition: opacity 0.2s;
            font-weight: bold;
          }
          
          .toast-item span:hover {
            opacity: 1;
          }
          
          .toast-item[data-color="blue"] span {
            color: #1e40af;
          }
          
          .toast-item[data-color="green"] span {
            color: #065f46;
          }
          
          .toast-item[data-color="yellow"] span {
            color: #92400e;
          }
          
          .toast-item[data-color="red"] span {
            color: #991b1b;
          }
          
          .toast-item[data-color="default"] span {
            color: #1f2937;
          }
          
          @media (max-width: 768px) {
            .toast-item {
              max-width: 265px;
              height: auto;
              padding-block: 8px;
            }
          }
          
          @media (max-width: 370px) {
            .toast-item {
              max-width: 235px;
            }
          }
        `;document.head.appendChild(style)}}},createToast(message,color){const toastId=`toast-${Date.now()}-${Math.random()}`;const toastElement=document.createElement('div');toastElement.id=toastId;toastElement.className='toast-item';toastElement.setAttribute('data-color',color||'default');const textElement=document.createElement('p');textElement.innerHTML=message;const closeButton=document.createElement('span');closeButton.textContent='✕';closeButton.onclick=()=>this.removeToast(toastId);toastElement.appendChild(textElement);toastElement.appendChild(closeButton);return{id:toastId,element:toastElement}},removeToast(toastId){const toastData=this.toasts.find(t=>t.id===toastId);if(!toastData)return;const toastElement=toastData.element;if(toastData.timeoutId){clearTimeout(toastData.timeoutId)}
toastElement.classList.remove('show');toastElement.classList.add('hide');setTimeout(()=>{if(toastElement&&toastElement.parentNode){toastElement.remove()}
this.toasts=this.toasts.filter(t=>t.id!==toastId);if(this.toasts.length===0){this.removeLoaders()}},300)},removeLoaders(){const loaders=document.querySelectorAll('.loader_container');loaders.forEach(loader=>{loader.removeAttribute('data-enabled')})},show(message,color='default'){this.init();const toast=this.createToast(message,color);this.container.appendChild(toast.element);toast.element.offsetHeight;setTimeout(()=>{toast.element.classList.add('show')},10);this.toasts.push(toast);setTimeout(()=>this.removeLoaders(),250);const timeoutId=setTimeout(()=>{this.removeToast(toast.id)},10000);toast.timeoutId=timeoutId;return toast.id},closeAll(){[...this.toasts].forEach(toast=>{this.removeToast(toast.id)})}};function toast(message,color){if((message||'').includes('Sua conta foi bloqueada')){message='Sua conta foi removida, por favor fale com nosso time de suporte caso queira restaurar.'}
return ToastManager.show(message,color)}
function closeToast(){ToastManager.closeAll()}
window.onError=(message)=>{if(message.toLowerCase().includes('negad')){checkoutDeniedPopup();return}
toast(message,'red');if(message.toLowerCase().includes('cupom')){document.querySelectorAll('.cart-alert-coupon').forEach(alert=>{alert.innerText=message;alert.style.display='flex';setTimeout(()=>{alert.style.display="none"},5500)})}}
window.ToastManager=ToastManager
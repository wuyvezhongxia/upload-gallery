import {createSlice} from '@reduxjs/toolkit';
import { message } from 'antd';
interface BaseConfig{
    token:string,
    scope:string,
    prefix:string,
    domain:string,
    date:number,
    compressImage?:any,
    config?:Record<string,any>
}

export interface QiNiuConfig extends BaseConfig{
    config:{
        useCdnDomain:boolean
    }
}

const configQiniuStore = createSlice({
    name:'config',
    initialState:{
        qiniu:localStorage.getItem('qiniu-config')
        ?JSON.parse(localStorage.getItem('qiniu-config')||'{}')
        :{
            prefix:'image',
            scope:'default',
            token:'',
            date:0,
            domain:'',
            config:{
                useCdnDomain:true
            }
        } as QiNiuConfig,
        parsedToken: {} as any,
        warningTimer:null as any,
    },
    reducers:{
       parseToken:(state,action)=>{
            try{
                const config = JSON.parse(atob(action.payload || import.meta.env.VITE_APP_UPLOAD_TOKEN))
                state.qiniu = { ...state.qiniu, ...config};
                state.parsedToken = state.qiniu
                localStorage.setItem('qiniu-config', JSON.stringify(state.qiniu))
                if (action.payload) {
                    localStorage.setItem('upload-token',action.payload)
                }
            }
            catch(error:any){
                if(state.warningTimer){
                    return
                }
                state.warningTimer = setTimeout(()=>{
                    state.warningTimer = null
                },3000)
                message.error("token 不正确，请点击右上角 🔑 重新设置",error);
            }
       
        }
    }
})


export const {parseToken} = configQiniuStore.actions;
export default configQiniuStore.reducer;
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
        qiniu:{
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
                console.log('111111111',action.payload);
                
                const config = JSON.parse(atob(action.payload || import.meta.env.VITE_APP_UPLOAD_TOKEN))
                console.log('222222222222',config);
                
                state.qiniu = { ...state.qiniu, ...config};
                // state.qiniu.token = action.payload
                
                console.log('33333333333333333333',state.qiniu);
                
                // state.qiniu.token = action.payload
                state.parsedToken = state.qiniu
                
                if (action.payload) {
                    localStorage.setItem('upload-token',action.payload)
                }

                console.log('token:', JSON.stringify(state.qiniu.token), typeof state.qiniu.token, state.qiniu.token.length);
            }
            catch(err:any){
                if(state.warningTimer){
                    return
                }
                state.warningTimer = setTimeout(()=>{
                    state.warningTimer = null
                },3000)
                message.error("token 不正确，请点击右上角 🔑 重新设置");
            }
       
        }
    }
})


export const {parseToken} = configQiniuStore.actions;
export default configQiniuStore.reducer;
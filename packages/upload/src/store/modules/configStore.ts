import {createSlice} from '@reduxjs/toolkit';
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
        state.parsedToken = action.payload
       } 
    }
})


export const {parseToken} = configQiniuStore.actions;
export default configQiniuStore.reducer;
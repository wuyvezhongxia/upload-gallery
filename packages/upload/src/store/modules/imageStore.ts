import { createSlice } from "@reduxjs/toolkit";

export interface ImageItem{
    url:string,
    name:string,
    date?:number,
    size:number,
    originSize?:number
}

const imageStore = createSlice({
  name: "imageStore",
  initialState: {
    imgList:(JSON.parse(localStorage.getItem('upload-image')||'[]') || []) as ImageItem[]
  },
  reducers: {
    addImage:(state,action)=>{
        state.imgList.unshift(action.payload)
        localStorage.setItem('upload-image',JSON.stringify(state.imgList,(key,value)=>(key==='file'?undefined:value)))
    }
  },
});
export const { addImage } = imageStore.actions;
export default imageStore.reducer;
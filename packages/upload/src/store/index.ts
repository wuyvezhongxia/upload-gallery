import { configureStore } from "@reduxjs/toolkit";
import configReducer from './modules/configStore';
import imageReducer from './modules/imageStore'
const store = configureStore({
    reducer:{
        config:configReducer,
        image:imageReducer
    }
})

export default store;
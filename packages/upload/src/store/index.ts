import { configureStore } from "@reduxjs/toolkit";
import { configReducer, imageReducer } from '@yuanjing/shared';

const store = configureStore({
    reducer:{
        config:configReducer,
        image:imageReducer
    }
})
export type RootState = ReturnType<typeof store.getState>
export default store;
import { createStore, combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { kPriceSlice } from "./kprice/slice";
import PeriodChangeReducer from "./period/PeriodChangeReducer";



const rootReducer = combineReducers({
    kPrice: kPriceSlice.reducer,
    periodChange: PeriodChangeReducer,
})

// const store = createStore(rootReducer);
const store = configureStore({
    reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;

export default store;
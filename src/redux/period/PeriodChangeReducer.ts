import { act } from "react";
import { updateLanguageServiceSourceFile } from "typescript";
import { CHANGE_BI_BUTTON, CHANGE_CENTER_BUTTON, CHANGE_CODE, CHANGE_CODE_LIST, CHANGE_LABEL_BUTTON, CHANGE_LABELS, CHANGE_MACD_BUTTON, CHANGE_MACD_VALUE, CHANGE_PERIOD, CHANGE_TIME, DataType, LOAD_CODE_NAME_DIC, PeriodChangeAction, SET_IS_MOBILE, StockInfoChangeAction, UPDATE_PRICE, UPDATE_PRICE_TIMER, UPDATE_PRICE_TIMER_FLAG} from "./PeriodChangeAction";
import Papa from 'papaparse';
import { getCurrentDateFormatted } from "../../components/chart/StockChart";

export interface PeriodState {
    period: "d" | "w" | "1min" | "5min" | "30min" | "60min" | "15min";
    code: string;
    codeName: string;
    startTime: string;
    endTime: string;
    biEnable: boolean;
    centerEnable: boolean;
    labelEnable: boolean;
    macdEnable: boolean;
    macdValue: number;
    updater: number;
    updaterTimer: number;
    updaterFlag: boolean;
    codeList: DataType[];
    codeNameDic: {};
    isMobile: boolean;
    labels: any[];
}
//按1一个月算时间
const daystr = getCurrentDateFormatted(0,0)
const monthstr = getCurrentDateFormatted(30,0)
let startStr = monthstr + "090000"
let endStr = daystr + "200000"
const defaultState: PeriodState = {
    period: "30min",
    code: "000688",
    codeName: "科创50指数",
    startTime: startStr,
    endTime: endStr,
    biEnable: true,
    centerEnable: true,
    labelEnable: false,
    macdEnable: false,
    macdValue: 30,
    updater: 0,
    updaterTimer: 0,
    updaterFlag: false,
    codeList: [],
    codeNameDic:{},
    isMobile: false,
    labels: []
}

export default (state = defaultState, action: StockInfoChangeAction) => {
    switch (action.type) {
        case CHANGE_PERIOD:
            return { ...state, period: action.payload};
        case CHANGE_CODE:
            return {...state, code: action.payload, codeName: state.codeNameDic[action.payload]}
        case CHANGE_TIME:
            return {...state, startTime: action.payload[0], endTime: action.payload[1]};
        case CHANGE_LABEL_BUTTON:
            return {...state, labelEnable: action.payload}
        case CHANGE_BI_BUTTON:
            return {...state, biEnable: action.payload}
        case CHANGE_CENTER_BUTTON:
            return {...state, centerEnable: action.payload}
        case CHANGE_MACD_BUTTON:
            return {...state, macdEnable: action.payload}
        case CHANGE_MACD_VALUE:
            return {...state, macdValue: action.payload}
        case UPDATE_PRICE:
            return {...state, updater: action.payload}
        case UPDATE_PRICE_TIMER:
            return {...state, updaterTimer: state["updaterTimer"] + 1}
        case UPDATE_PRICE_TIMER_FLAG:
            return {...state, updaterFlag: action.timerFlag}
        case CHANGE_CODE_LIST:
            return {...state, codeList: action.payload}
        case LOAD_CODE_NAME_DIC:
            return {...state, codeNameDic: action.payload}
        case SET_IS_MOBILE:
            return {...state, isMobile: action.payload}
        case CHANGE_LABELS:
            return {...state, labels: action.payload}
        default:
            return state;
    }
};
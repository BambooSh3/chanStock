import { enableAllPlugins } from "immer"

export const CHANGE_PERIOD = "change_period"
export const CHANGE_CODE = "change_code"
export const CHANGE_TIME = "change_time"
export const CHANGE_LABEL_BUTTON = "change_label_button"
export const CHANGE_CENTER_BUTTON = "change_center_button"
export const CHANGE_BI_BUTTON = "change_bi_button"
export const CHANGE_MACD_BUTTON = "change_macd_button"
export const CHANGE_MACD_VALUE = "change_macd_value"
export const UPDATE_PRICE = "update_price"
export const UPDATE_PRICE_TIMER = "update_price_timer"
export const UPDATE_PRICE_TIMER_FLAG = "update_price_timer_flag"
export const CHANGE_CODE_LIST = "change_code_list"
export const LOAD_CODE_NAME_DIC = "load_code_name_dic"
export const SET_IS_MOBILE = "set_is_mobile"

export interface DataType {
    key: string;
    name: string;
    code: string;
  }
export interface PeriodChangeAction {
    type: typeof CHANGE_PERIOD;
    payload: "d" | "w"| "1min" | "5min" | "60min" | "30min" | "15min";
}
export interface ChangeCodeListAction {
    type: typeof CHANGE_CODE_LIST;
    payload: DataType[]
}
export interface LoadCodeNameDicAction {
    type: typeof LOAD_CODE_NAME_DIC;
    payload: {}
}

export interface CodeChangeAction {
    type: typeof CHANGE_CODE;
    payload: string;
}

export interface TimeChangeAction {
    type: typeof CHANGE_TIME;
    payload: string[];  //startTime endTime
}

export interface LabelChangeAction {
    type: typeof CHANGE_LABEL_BUTTON;
    payload: boolean
}
export interface CenterChangeAction {
    type: typeof CHANGE_CENTER_BUTTON;
    payload: boolean
}
export interface BiChangeAction {
    type: typeof CHANGE_BI_BUTTON;
    payload: boolean
}
export interface MACDChangeAction {
    type: typeof CHANGE_MACD_BUTTON;
    payload: boolean;
}
export interface MACDChangeValue {
    type: typeof CHANGE_MACD_VALUE;
    payload: number;
}
export interface UpdatePrice {
    type: typeof UPDATE_PRICE;
    payload: number;
}
export interface UpdatePriceTimer{
    type: typeof UPDATE_PRICE_TIMER;
}
export interface UpdatePriceTimerFlag{
    type: typeof UPDATE_PRICE_TIMER_FLAG;
    timerFlag: boolean;
}
export interface setIsMobileAction {
    type: typeof SET_IS_MOBILE;
    payload: boolean;
}


export type StockInfoChangeAction = PeriodChangeAction | CodeChangeAction | MACDChangeValue |
 TimeChangeAction | LabelChangeAction | CenterChangeAction | BiChangeAction | MACDChangeAction
  | UpdatePrice | UpdatePriceTimer | UpdatePriceTimerFlag | ChangeCodeListAction | LoadCodeNameDicAction | setIsMobileAction;


export const changeCodeListActionCreator = (list: DataType[]): StockInfoChangeAction => {
    return {
        type: CHANGE_CODE_LIST,
        payload: list
    }
}
export const loadCodeNameDicActionCreator = (dic: {}): StockInfoChangeAction => {
    return {
        type: LOAD_CODE_NAME_DIC,
        payload: dic
    }
}
export const setIsMobileCreator = (isMobile: boolean): setIsMobileAction => {
    return {
        type: SET_IS_MOBILE,
        payload: isMobile
    }
}
export const changePeriodActionCreator = (period:  "d" | "w" | "1min" | "5min" | "60min" | "30min" | "15min"): StockInfoChangeAction => {
    return {
        type: CHANGE_PERIOD,
        payload: period,
    };
};

export const changeCodeActionCreator = (code: string): StockInfoChangeAction => {
    return {
        type: CHANGE_CODE,
        payload: code
    }  
};


export const changeTimeActionCreator = (time: string[]): StockInfoChangeAction => {
    return {
        type: CHANGE_TIME,
        payload: time
    }

};

export const changeLabelActionCreator = (enable: boolean): StockInfoChangeAction => {
    return {
        type: CHANGE_LABEL_BUTTON,
        payload: enable
    }
}
export const changeBiActionCreator = (enable: boolean): StockInfoChangeAction => {
    return {
        type: CHANGE_BI_BUTTON,
        payload: enable
    }
}
export const changeCenterActionCreator = (enable: boolean): StockInfoChangeAction => {
    return {
        type: CHANGE_CENTER_BUTTON,
        payload: enable
    }
}

export const changeMACDActionCreator = (enable: boolean): StockInfoChangeAction => {
    return {
        type: CHANGE_MACD_BUTTON,
        payload: enable
    }
}

export const macdChangeValueCreator = (value: number): StockInfoChangeAction => {
    return {
        type: CHANGE_MACD_VALUE,
        payload: value
    }
}

export const updatePriceCreator = (value: number): StockInfoChangeAction => {
    return {
        type: UPDATE_PRICE,
        payload: value
    }
}

export const updateTimerCreator = (): StockInfoChangeAction => {
    return {
        type: UPDATE_PRICE_TIMER
    }
}
export const updateTimerFlagCreator = (flag: boolean): StockInfoChangeAction => {
    return {
        type: UPDATE_PRICE_TIMER_FLAG,
        timerFlag: flag,
    }
}
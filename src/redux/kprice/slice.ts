import axios from "axios";
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { data } from "@remix-run/router/dist/utils";
import { dateFormat, merge } from "highcharts";
import { idText, nodeModuleNameResolver } from "typescript";

export interface KItem {
    open: number;
    close: number;
    low: number;
    high: number;
    date: string;
    code: string;
    vol: number; //成交量
    range: number; //涨跌幅度
    index: number;
}
//资金净流入数据
export interface CapitalItem {
    today: number;
    threeDay: number;
    fiveDay: number;
    todayStr: string;
    threeDayStr: string;
    fiveDayStr: string;
}
export interface DayPriceItem {
    price: number;
    rate: string;
    color: string;
}

// 通过k线生成MA线
export interface MAItem {
    close: number;
    date: string;
    code: string
}

export interface ChanMergeItem {
    date: string;
    high: number;
    low: number;
    code: string;
    index: number;
}

//顶点
export interface ChanPointItem {
    date: string;
    code: string;
    type: "bottom" | "top";
    point: number;
    index: number;
}

export interface BuySellItem {
    date: string;
    centerRightDate: string;
    code: string;
    price: number;
    type: "buy" | "sell";
    index: number;
}

// 中枢
export interface ChanCenterItem {
    leftDate: string;
    rightDate: string;
    leftIndex: number;
    rightIndex: number;
    bottom: number;
    top: number;
}


interface PriceState {
    data: KItem[];
    maData5: MAItem[];
    maData10: MAItem[];
    maData20: MAItem[];
    maData90: MAItem[];
    maData250: MAItem[];
    macd: MAItem[];
    macdDif: MAItem[];
    macdDEA: MAItem[];
    chanBi: ChanPointItem[];
    chanCenter: ChanCenterItem[];
    loading: boolean;
    error: string | null;
}


const defaultState: PriceState = {
    data: [],
    maData5: [],
    maData10: [],
    maData20: [],
    maData90: [],
    maData250: [],
    macd: [],
    macdDif: [],
    macdDEA: [],
    chanBi: [],
    chanCenter: [],
    error: null,
    loading: true
}

export function genMAData(kList: KItem[], size) {
    let maList: MAItem[] = [];
    if (size > kList.length) {
        return maList;
    }
    for (let i = 0; i < kList.length; i++) {
        if (i < size - 1) {
            let node = { close: kList[i].close * size, date: kList[i].date, code: kList[i].code };
            maList.push(node);
        } else if (i == size - 1) {
            let cnt = 0;
            for (let j = 0; j < size; j++) {
                cnt = cnt + kList[j].close;
            }
            let node = { close: cnt, date: kList[i].date, code: kList[i].code };
            for (let k = 0; k < maList.length; k++) {
                maList[k].close = cnt;
            }
            maList.push(node);
        } else {
            let cur = maList[maList.length - 1].close + kList[i].close - kList[i - size].close;
            let node = { close: cur, date: kList[i].date, code: kList[i].code };
            maList.push(node);
        }
    }
    for (let i = 0; i < maList.length; i++) {
        maList[i].close = Math.round((maList[i].close / size) * 100) / 100;
    }
    return maList;
}

export function genMACDData(kList: KItem[]) {
    let macdList: MAItem[] = [];
    let macdDif: MAItem[] = [];
    let macdDEA: MAItem[] = [];
    let ema_12_list: MAItem[] = [];
    let ema_26_list: MAItem[] = [];
    for (let i = 0; i < kList.length; i++) {
        if (i == 0) {
            ema_12_list.push({ close: kList[i].close, date: kList[i].date, code: kList[i].code })
            ema_26_list.push({ close: kList[i].close, date: kList[i].date, code: kList[i].code })
            macdDif.push({ close: 0, date: kList[i].date, code: kList[i].code })
        } else {
            let pre_ema_12 = ema_12_list[ema_12_list.length - 1];
            let pre_ema_26 = ema_26_list[ema_26_list.length - 1];
            let cur_ema_12 = pre_ema_12.close * 11.0 / 13.0 + kList[i].close * 2.0 / 13.0;
            let cur_eam_26 = pre_ema_26.close * 25.0 / 27.0 + kList[i].close * 2.0 / 27.0;
            ema_12_list.push({ close: cur_ema_12, date: kList[i].date, code: kList[i].code });
            ema_26_list.push({ close: cur_eam_26, date: kList[i].date, code: kList[i].code })
            macdDif.push({ close: cur_ema_12 - cur_eam_26, date: kList[i].date, code: kList[i].code })
        }
    }
    for (let i = 0; i < macdDif.length; i++) {
        if (i == 0) {
            macdDEA.push(macdDif[i]);
            macdList.push({ close: 0, date: macdDif[i].date, code: macdDif[i].code });
        } else {
            let pre_dea = macdDEA[macdDEA.length - 1].close;
            let cur_dea = pre_dea * 8.0 / 10.0 + macdDif[i].close * 2.0 / 10.0;
            macdDEA.push({ close: cur_dea, date: macdDif[i].date, code: macdDif[i].code })
            let cur_macd = (macdDif[i].close - cur_dea) * 2.0;
            macdList.push({ close: cur_macd, date: macdDif[i].date, code: macdDif[i].code })
        }
    }
    return { macd: macdList, dif: macdDif, dea: macdDEA }
}

function genMergeList(datas: KItem[]) {
    let resData: ChanMergeItem[] = [];
    for (let i = 0; i < datas.length; i++) {
        if (i == 0) {
            let node = { code: datas[i].code, high: datas[i].high, low: datas[i].low, date: datas[i].date, index: i }
            resData.push(node);
        } else {
            let pre = resData[resData.length - 1];
            let needMerge = false;
            let mergeType = 0; //默认底部merge类型，即取min
            let index_date = pre.date;
            let index = pre.index;
            if (pre.high >= datas[i].high && pre.low <= datas[i].low) {
                needMerge = true
                index_date = pre.date;
                index = pre.index;
            } else if (pre.high <= datas[i].high && pre.low >= datas[i].low) {
                needMerge = true
                index_date = datas[i].date
                index = i;
            }
            if (datas.length > 1) {
                let pre_pre = datas[datas.length - 2];
                if (pre.high > pre_pre.high) {
                    mergeType = 1; // 即顶merge类型
                }
            }
            if (needMerge) {
                if (mergeType == 0) {
                    let low = Math.min(pre.low, datas[i].low)
                    let high = Math.min(pre.high, datas[i].high)
                    let node = { code: datas[i].code, high: high, low: low, date: index_date, index: index }
                    resData[resData.length - 1] = node;
                } else if (mergeType == 1) {
                    let low = Math.max(pre.low, datas[i].low)
                    let high = Math.max(pre.high, datas[i].high)
                    let node = { code: datas[i].code, high: high, low: low, date: index_date, index: index }
                    resData[resData.length - 1] = node
                }
            } else {
                resData.push({ code: datas[i].code, high: datas[i].high, low: datas[i].low, date: datas[i].date, index: i })
            }
        }
    }
    // console.log("merge list", resData)
    return resData
}

export function genBiPointList(datas: KItem[]) {
    let mergeList = genMergeList(datas);
    let resList: ChanPointItem[] = [];
    if (mergeList.length <= 2) {
        return resList;
    }
    //判断第一个元素是顶还是底
    let firstIndexDate = mergeList[0].date;
    let firstIndex = mergeList[0].index;
    let point = mergeList[0].low;
    let pointType: "bottom" | "top" = "bottom"
    if (mergeList[1].low < mergeList[0].low) {
        point = mergeList[0].high
        pointType = "top"
    }
    resList.push({ code: mergeList[0].code, date: firstIndexDate, point: point, type: pointType, index: firstIndex })
    for (let i = 0; i < mergeList.length; i++) {
        if (i == 0) {
            continue
        } else if (i == mergeList.length - 1) {
            continue
        } else {
            let preNode = mergeList[i - 1];
            let nextNode = mergeList[i + 1];
            let node = mergeList[i]
            //顶
            if (node.high >= preNode.high && node.high >= nextNode.high) {
                if (node.index - resList[resList.length - 1].index >= 4) {
                    if (resList[resList.length - 1].type == "bottom") {
                        resList.push({ code: node.code, date: node.date, point: node.high, type: "top", index: node.index })
                    } else if (resList[resList.length - 1].type == "top") {
                        if (node.high > resList[resList.length - 1].point) {
                            resList[resList.length - 1] = { code: node.code, date: node.date, point: node.high, type: "top", index: node.index }
                        }

                    }
                } else {
                    if (resList[resList.length - 1].type == "top") {
                        if (node.high > resList[resList.length - 1].point) {
                            resList[resList.length - 1] = { code: node.code, date: node.date, point: node.high, type: "top", index: node.index }
                        }
                    }
                }
            } else if (node.low <= preNode.low && node.low <= nextNode.low) {
                // 底
                if (node.index - resList[resList.length - 1].index >= 4) {
                    if (resList[resList.length - 1].type == "bottom") {
                        if (node.low < resList[resList.length - 1].point) {
                            resList[resList.length - 1] = { code: node.code, date: node.date, point: node.low, type: "bottom", index: node.index }
                        }
                    } else if (resList[resList.length - 1].type == "top") {
                        resList.push({ code: node.code, date: node.date, point: node.low, type: "bottom", index: node.index })
                    }

                } else {
                    if (resList[resList.length - 1].type == "bottom") {
                        if (node.low < resList[resList.length - 1].point) {
                            resList[resList.length - 1] = { code: node.code, date: node.date, point: node.low, type: "bottom", index: node.index }
                        }
                    }
                }
            }

        }
    }
    //补一下最后一个点
    let node = datas[datas.length - 1]
    if (resList[resList.length - 1].type == "top") {
        if (datas[datas.length - 1].close >= resList[resList.length - 1].point) {
            resList[resList.length - 1] = { code: node.code, date: node.date, point: node.close, type: "top", index: node.index }
        } else {
            resList.push({ code: node.code, date: node.date, point: node.close, type: "bottom", index: node.index })
        }
    } else {
        if (node.close < resList[resList.length - 1].point) {
            resList[resList.length - 1] = { code: node.code, date: node.date, point: node.close, type: "bottom", index: node.index }
        } else {
            resList.push({ code: node.code, date: node.date, point: node.close, type: "top", index: node.index })
        }
    }
    return resList;
}

function findMACDArea(macd:MAItem[], index: number): null | number {
    if(index < 0 || index >= macd.length) {
        return null
    }
    const flag = macd[index].close >= 0 
    let sum = macd[index].close
    let p = index-1;
    while(p>=0 && (macd[p].close >= 0) == flag ) {
        sum += macd[p].close
        p--
    }
    p = index + 1
    while(p<macd.length-1 && (macd[p].close >= 0) == flag ) {
        sum += macd[p].close
        p++
    } 
    return sum
}

//当前只支持一个买卖点判断，只判断当前位置，如果不符合就返回空数组
//先按macd的diff和dea来判断吧，忽略bi先
export function genBuySellPoint(
    bi: ChanPointItem[], 
    center: ChanCenterItem[], 
    curKItem: KItem, 
    dif:MAItem[], 
    dea:MAItem[], 
    macd: MAItem[],
    lastBuySellPoint: BuySellItem|null, 
    period: string): BuySellItem[] {
    if(center.length <= 0 || bi.length < 4) {
        return []
    }
    const lastCenter = center[center.length - 1]
    const lastdif = dif[dif.length-1]
    const lastdea = dea[dea.length-1]
    const curPrice = curKItem.close
    const bi_3:ChanPointItem = bi[bi.length-2]
    const bi_2:ChanPointItem = bi[bi.length-3]
    const bi_1:ChanPointItem = bi[bi.length-4]
    //金叉买入
    if(lastdif.close >= lastdea.close) {
        console.log('金叉',period,bi_1.type, bi_2.type,bi_3.type)
        if(bi_1.type == "bottom" && bi_2.type == 'top' && bi_3.type == 'bottom') {
            if (lastBuySellPoint != null &&  
                lastBuySellPoint.type == "buy") {
                return []
            }
            const area_1 = findMACDArea(macd, bi_1.index)
            const area_3 = findMACDArea(macd, bi_3.index)
            // console.log(area_1, area_3)
            if(area_1!=null && area_3 != null) {
                if(Math.abs(area_3) < Math.abs(area_1) && area_1 < 0) {
                    //面积在变小
                    const bi_index = bi_2.index
                    const bi2_dif = dif[bi_index]
                    const bi2_dea = dea[bi_index]
                    // console.log('bi2 dea and dif',bi2_dif.close,bi2_dea.close)
                    if(bi2_dea.close >= 0 || bi2_dif.close >= 0) {
                        //可买入
                        let point: BuySellItem = {date: curKItem.date,
                            price: curPrice,
                             code: curKItem.code, 
                             index: curKItem.index,
                              type: "buy",
                              centerRightDate: lastCenter.rightDate}
                        console.log('buy point',period,bi2_dea.close, bi2_dif.close, area_1, area_3,
                             lastBuySellPoint?.centerRightDate, lastCenter.rightDate)
                       return [point]
                    }
                }
            }
            
        }

    } else if (lastdif.close <= lastdea.close) {
        console.log('死叉',period,bi_1.type, bi_2.type, bi_3.type)
    //死叉卖出
        if(bi_1.type == "top" && bi_2.type == 'bottom' && bi_3.type == 'top') {
            if (lastBuySellPoint != null &&  
                lastBuySellPoint.type == "sell") {
                return []
            }
            const area_1 = findMACDArea(macd, bi_1.index)
            const area_3 = findMACDArea(macd, bi_3.index)
            // console.log(area_1, area_3)
            if(area_1!=null && area_3 != null) {
                if(Math.abs(area_3) < Math.abs(area_1) && area_1 > 0) {
                    //面积在变小
                    const bi_index = bi_2.index
                    const bi2_dif = dif[bi_index]
                    const bi2_dea = dea[bi_index]
                    // console.log('bi2 dea and dif',bi2_dif.close,bi2_dea.close)
                    if(bi2_dea.close <= 0 || bi2_dif.close <= 0) {
                        //可买入
                        let point: BuySellItem = {date: curKItem.date,
                            price: curPrice,
                            code: curKItem.code, 
                            index: curKItem.index,
                            type: "sell",
                            centerRightDate: lastCenter.rightDate}
                            console.log('sell point',period,bi2_dea.close, bi2_dif.close, area_1, area_3,
                                lastBuySellPoint?.centerRightDate, lastCenter.rightDate)
                    return [point]
                    }
                }
            }
            
        } 

    }
    return []
    //如果当前位置价格在中枢内部，不存在买卖点
    // if (curPrice >= lastCenter.bottom && curPrice <= lastCenter.top) {
    //     return []
    // } else if (curPrice > lastCenter.top) {
    //     if(lastdif.close < 0 && lastdea.close < 0) {
    //         return []
    //     }
    //     //在中枢之上，看是否是买入点位
    //     //金叉才识别为买点
    //     if(lastdif.close < lastdea.close) {
    //         return []
    //     }
    //     if (lastBuySellPoint != null &&  
    //         lastBuySellPoint.type == "buy" &&
    //         lastBuySellPoint.centerRightDate == lastCenter.rightDate) {
    //         return []
    //     }
    //     let lastBi = bi[bi.length - 1]
    //     let lastlastBi = bi[bi.length - 2]
    //     let preBi = curKItem.index == lastBi.index ? lastlastBi : lastBi
    //     if (preBi.point > lastCenter.top) {
    //         let point: BuySellItem = {date: curKItem.date,
    //             price: curPrice,
    //              code: curKItem.code, 
    //              index: curKItem.index,
    //               type: "buy",
    //               centerRightDate: lastCenter.rightDate}
    //        return [point]
    //     }
    //     return []
    // } else if (curPrice < lastCenter.bottom) {
    //     console.log('haojin test bottom here')                
    //     //在中枢之下，看是否是卖出点位
    //     if(lastdif.close < 0 || lastdea.close < 0) {
    //         console.log('has below zero')
    //         if (lastdif.close < lastdea.close) {
    //             console.log('dif < dea')
    //             if (lastBuySellPoint != null &&  
    //                 lastBuySellPoint.type == "sell" &&
    //                 lastBuySellPoint.centerRightDate == lastCenter.rightDate) {
    //                 return []
    //             }
    //             let lastBi = bi[bi.length - 1]
    //             let lastlastBi = bi[bi.length - 2]
    //             let preBi = curKItem.index == lastBi.index ? lastlastBi : lastBi
    //             console.log(preBi.type, preBi.point, lastCenter.bottom)
    //             if(preBi.point < lastCenter.bottom) {
    //                 let point: BuySellItem = {date: curKItem.date,
    //                     price: curPrice,
    //                      code: curKItem.code, 
    //                      index: curKItem.index,
    //                       type: "sell",
    //                       centerRightDate: lastCenter.rightDate}
    //                return [point] 
    //             }
    //             return []
    //         }
    //     }
    //     return []
    // }
    // return []
}

export function genCenterList(pointList: ChanPointItem[]) {
    let centerList: ChanCenterItem[] = [];
    if (pointList.length < 2) {
        return centerList;
    }
    let index = 1;
    while (index < pointList.length) {
        if (index + 3 < pointList.length) {
            if (pointList[index].type == "bottom") {
                //下跌趋势
                if (pointList[index + 3].point <= pointList[index].point) {
                    index = index + 2;
                    continue;
                }
            } else {
                //上涨趋势
                if (pointList[index + 3].point >= pointList[index].point) {
                    index = index + 2;
                    continue
                }

            }
        }
        //还没有形成中枢
        let hasNoCenter = centerList.length <= 0
        let allAboveBelowCenter = false
        if (centerList.length > 0 && index + 2 < pointList.length){
            let p1 = pointList[index].point >= centerList[centerList.length-1].top
            let p2 = pointList[index+1].point >= centerList[centerList.length-1].top
            let p3 = pointList[index+2].point >= centerList[centerList.length-1].top
            if (p1 && p2 && p3) {
                allAboveBelowCenter = true
            } else {
                p1 = pointList[index].point <= centerList[centerList.length-1].bottom
                p2 = pointList[index+1].point <= centerList[centerList.length-1].bottom
                p3 = pointList[index+2].point <= centerList[centerList.length-1].bottom
                if (p1 && p2 && p3) {
                    allAboveBelowCenter = true
                }
            }
        }
        if (hasNoCenter || allAboveBelowCenter) {
            //如果是底
            if (pointList[index].type == "bottom") {
                //取四个点(index, index+1,index+2,index+3)
                if(index+3 < pointList.length){
                    //下跌趋势
                    if(pointList[index+3].point <= pointList[index].point){
                        index = index + 2;
                        continue
                    } else {
                        //形成中枢
                        let d1 = pointList[index].point
                        let g1 = pointList[index + 1].point
                        let d2 = pointList[index+2].point
                        let g2 = pointList[index+ 3].point
                        let temCenter = {leftDate: pointList[index].date, 
                            leftIndex: pointList[index].index, 
                            rightDate: pointList[index+3].date,
                             rightIndex: pointList[index+3].index,
                              bottom: Math.max(d1,d2), 
                              top: Math.min(g1,g2)}
                        centerList.push(temCenter)
                        if (g2 > temCenter.top) {
                            index = index + 3;
                        } else {
                            index = index + 4;
                        }
                        continue
                    }
                } else {
                    break
                }
            } else {
                //如果是顶
                if(index+3<pointList.length){
                    //上涨趋势中
                    if(pointList[index+3].point > pointList[index].point){
                        index = index + 2
                        continue
                    } else {
                        //形成中枢
                        let g1 = pointList[index].point
                        let d1 = pointList[index+1].point
                        let g2 = pointList[index+2].point
                        let d2 = pointList[index+3].point
                        let temCenter = {leftDate: pointList[index].date, 
                            leftIndex: pointList[index].index, 
                            rightDate: pointList[index+3].date,
                             rightIndex: pointList[index+3].index,
                              bottom: Math.max(d1,d2), 
                              top: Math.min(g1,g2)}
                        centerList.push(temCenter)
                        if(d2<temCenter.bottom){
                            index = index + 3
                        } else {
                            index = index + 4
                        }
                        continue
                    }
                } else {
                    break
                }
            }
        } else {
            //已经有中枢了
            let temCenter = centerList[centerList.length-1]
            let bottom = temCenter.bottom
            let top = temCenter.top
            //如果是底
            if (pointList[index].type == "bottom") {
                if (pointList[index].point >= top) {
                    //考察会不会形成新的中枢（index-1,index,index+1,index+2）
                    if(index+2<pointList.length){
                        if(pointList[index+2].point >= top){
                             //形成了新中枢
                            let g1 = pointList[index-1].point
                            let d1 = pointList[index].point
                            let g2 = pointList[index+1].point
                            let d2 = pointList[index+2].point
                            let temCenter = {leftDate: pointList[index-1].date, 
                                leftIndex: pointList[index-1].index, 
                                rightDate: pointList[index+2].date,
                                rightIndex: pointList[index+2].index,
                                bottom: Math.max(d1,d2), 
                                top: Math.min(g1,g2)}
                            centerList.push(temCenter)
                            index = index + 3
                            continue
                        } else {
                            index = index + 1;
                            continue;
                        }
                    } else {
                        break
                    }
                   
                }else {
                    //不形成中枢，往前走
                    index = index + 1
                    continue
                }
            } else {
                //如果是顶
                if(pointList[index].point <= bottom) {
                    //考察会不会形成新的中枢（index-1,index,index+1,index+2）
                    if(index+2<pointList.length){
                        if(pointList[index+2].point<=bottom){
                            //形成新中枢
                            let d1 = pointList[index-1].point
                            let g1 = pointList[index].point
                            let d2 = pointList[index+1].point
                            let g2 = pointList[index+2].point
                            let temCenter = {leftDate: pointList[index-1].date, 
                                leftIndex: pointList[index-1].index, 
                                rightDate: pointList[index+2].date,
                                rightIndex: pointList[index+2].index,
                                bottom: Math.max(d1,d2), 
                                top: Math.min(g1,g2)}
                            index = index + 3
                            continue
                        } else {
                            index = index + 1
                            continue
                        }
                    } else {
                        break
                    }
                } else {
                    index = index + 1
                    continue
                }
            }
        }
    }
    return centerList;
}

function numberToCapitalString(num: number): string {
    const billion = 100000000;
    const tenThousand = 10000;
    if (Math.abs(num) >= billion) {
        // 如果数值大于等于 1 亿，以亿为单位
        const result = (num / billion).toFixed(2);
        return `${result} 亿`;
    } else if (Math.abs(num) >= tenThousand) {
        // 如果数值大于等于 1 万，以万为单位
        const result = (num / tenThousand).toFixed(2);
        return `${result} 万`;
    } else {
        // 数值小于 1 万，直接显示
        return num.toString();
    }
}

export function parseCapital(datas: any[]) : CapitalItem {
    let day: number = 0;
    let threeDay: number = 0;
    let fiveDay: number = 0;
    var len = datas.length;
    if (len > 0) {
        day = datas[len-1]["主力净流入-净额"]
    }
    if (len >= 3) {
        threeDay = datas[len-1]["主力净流入-净额"] + datas[len-2]["主力净流入-净额"] + datas[len-3]["主力净流入-净额"] 
    }
    if (len >= 5) {
        fiveDay = datas[len-1]["主力净流入-净额"] + datas[len-2]["主力净流入-净额"] + datas[len-3]["主力净流入-净额"] + datas[len-4]["主力净流入-净额"] + datas[len-5]["主力净流入-净额"]
    }
    return {today: day, threeDay: threeDay, fiveDay: fiveDay, 
        todayStr: numberToCapitalString(day),
         threeDayStr: numberToCapitalString(threeDay), 
         fiveDayStr: numberToCapitalString(fiveDay)}
}

export function parseDailyPrice(datas: any[]) {
    let result: DayPriceItem = {price: 0, rate: '0%', color: '#FF0000'}
    let priceList = parseDailyData(datas)
    if (priceList.length > 0) {
        let lastItem = priceList[priceList.length - 1]
        let close = lastItem.close
        let rate = lastItem.range
        let colorStr = rate > 0 ? "#FF0000" : "#006400"
        result = {price: close, rate: `${rate}%`, color: colorStr} 
    }
    return result
}

export function parseDailyData(datas: any[]) {
    // console.log("haojin test len:", datas.length)
    let priceList: KItem[] = []

    for (let i = 0; i < datas.length; i++) {
        let item = {
            open: datas[i]["开盘"],
            close: datas[i]["收盘"],
            low: datas[i]["最低"],
            high: datas[i]["最高"],
            date: datas[i]["日期"],
            code: datas[i]["股票代码"],
            vol: datas[i]["成交量"],
            range: datas[i]["涨跌幅"],
            index: i
        }
        priceList.push(item);
    }
    return priceList;
}

export function parseMinData(datas: any[], code: string) {
    // console.log("haojin test len:", datas.length)
    let priceList: KItem[] = []
    for (let i = 0; i < datas.length; i++) {
        let open = datas[i]["开盘"]
        if (open == 0){
            open = datas[i]["最低"]
        }
        let item = {
            open: open,
            close: datas[i]["收盘"],
            low: datas[i]["最低"],
            high: datas[i]["最高"],
            date: datas[i]["时间"],
            code: code,
            vol: datas[i]["成交量"],
            range: datas[i]["涨跌幅"],
            index: i
        }
        priceList.push(item);
    }
    return priceList;
}

export const codeMap = ["000688","512660"]
export const hkCodeMap = ["01810",'09888','00700','00981','09660']

export function dailyPriceUrl(code: string): string {
    let url = genKPriceUrl('day', 'stock')
    if (codeMap.includes(code)){
        url = genKPriceUrl('day', 'etf')
    } else if (hkCodeMap.includes(code)) {
        url = genKPriceUrl('day','hk')
    } 
    var date = getCurrentDateInFormat()
    url = url + `?symbol=${code}&period=daily&start_date=${date}&end_date=${date}`;
    return url;
}

// http://127.0.0.1:8080/api/public/stock_zh_a_hist?symbol=601021&period=daily&start_date=20240920&end_date=20240930&adjust=hfq

export function getCurrentDateInFormat(): string {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    // 获取月份，需要加 1，因为月份是从 0 开始计数的
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

export function capitalInfoUrl(code: string): string {
    let market = "sh"
    if (code[0] == '0' || code[0] == '3') {
        market = 'sz'
    }
    return `http://127.0.0.1:8080/api/public/stock_individual_fund_flow?stock=${code}&market=${market}`
}

export function genKPriceUrl(period: "day" | "min", type: "stock" | "etf" | "hk"): string {
    if (navigator.userAgent.indexOf('Windows') > -1) {
        // for remote 
        if (period == "day") {
            if (type == "stock") {
                return "http://192.168.31.62:8000/daily_stock_data" 
            } else if (type == "hk") {
                // todo
                return "http://192.168.31.62:8000/daily_etf_data" 
            } else {
                return "http://192.168.31.62:8000/daily_etf_data" 
            }
        } else {
            if (type == "stock") {
                return "http://192.168.31.62:8000/min_stock_data"
            } else if (type == 'hk') {
                // todo
                return "http://192.168.31.62:8000/min_etf_data"
            } else {
                return "http://192.168.31.62:8000/min_etf_data"
            }
        }
    } else {
        // for mac local
        if (period == "day") {
            if (type == "stock") {
                return "http://127.0.0.1:8080/api/public/stock_zh_a_hist" 
        } else if (type == 'hk') {
                return "http://127.0.0.1:8080/api/public/stock_hk_hist" 
        } else {
                return "http://127.0.0.1:8080/api/public/index_zh_a_hist" 
            }
        } else {
            if (type == "stock") {
                return "http://127.0.0.1:8080/api/public/stock_zh_a_hist_min_em"
            } else if (type == 'hk') {
                return "http://127.0.0.1:8080/api/public/stock_hk_hist_min_em"  
            } else {
                return "http://127.0.0.1:8080/api/public/index_zh_a_hist_min_em" 
            }
        } 
    } 
}
export const searchKPrice = createAsyncThunk(
    "kprice/searchKPrice",
    async (param: any, thunkAPI) => {
        // 日k线
        if (param["period"] == "daily" || param["period"] == "weekly") {
            let url = ""
            url = genKPriceUrl("day", "stock")
            if (codeMap.includes(param["code"])){
                url = genKPriceUrl("day", "etf") 
            } else if (hkCodeMap.includes(param["code"])) {
                url = genKPriceUrl("day", "hk")
            }
            var start_date = param["start_date"]
            var end_date = param["end_date"]
            if (start_date.length > 8) {
                //去除时分秒
                start_date = start_date.substring(0,8)
            }
            if (end_date.length > 8) {
                end_date = end_date.substring(0,8)
            }
            url = url + `?symbol=${param["code"]}&period=${param["period"]}&start_date=${start_date}&end_date=${end_date}`;
            console.log("haojin test ", url);
            const { data } = await axios.get(url);
            // console.log("haojin test data is ", data);
            return parseDailyData(data);
        } else {
            let url = ""
            url = genKPriceUrl("min",'stock')
            if (codeMap.includes(param["code"])){
                url = genKPriceUrl("min","etf")
            } else if (hkCodeMap.includes(param["code"])) {
                url = genKPriceUrl('min', 'hk')
            }
            url = url + `?symbol=${param["code"]}&period=${param["period"]}&start_date=${param["start_date"]}&end_date=${param["end_date"]}`;
            console.log("haojin test ", url);
            const { data } = await axios.get(url);
            return parseMinData(data, param["code"]);
        }

    }
);

export const kPriceSlice = createSlice({
    name: "searchKPrice",
    initialState: defaultState,
    reducers: {},
    extraReducers: {
        [searchKPrice.pending.type]: (state) => {
            state.loading = true;

        },
        [searchKPrice.fulfilled.type]: (state, action) => {
            state.data = action.payload;
            state.maData5 = genMAData(state.data, 5);
            state.maData10 = genMAData(state.data, 10);
            state.maData20 = genMAData(state.data, 20);
            state.maData90 = genMAData(state.data, 90);
            state.maData250 = genMAData(state.data, 250);
            let { macd, dif, dea } = genMACDData(state.data);
            state.macd = macd;
            state.macdDif = dif;
            state.macdDEA = dea;
            state.chanBi = genBiPointList(state.data);
            state.chanCenter = genCenterList(state.chanBi);
            state.loading = false;
            state.error = null;
        },
        [searchKPrice.rejected.type]: (state, action: PayloadAction<string | null>) => {
            state.loading = false;
            state.error = action.payload;
        }
    }
})
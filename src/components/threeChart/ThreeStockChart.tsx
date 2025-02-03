
import { Button, Col, DatePicker, Dropdown, InputNumber, Row } from "antd"
import Input from "antd/es/input"
import Item from "antd/es/list/Item"
import HighchartsReact from "highcharts-react-official";
import Highcharts, { dateFormat, numberFormat, setOptions } from 'highcharts/highstock';
import Typography from "antd/es/typography"
import React, { useEffect, useRef, useState } from "react"
import { findRangeName, genPeriodUrlKey, getCurrentDateFormatted,
     getPeriodName, parseBuySellPointLabel, parseChanBi, parseChanBiLabel, parseChanCenter,
      parseData, parseMACD, parseMaData, parseMarkLine, parseVolData, periodList, rangeList } from "../chart/StockChart"
import styles from "./ThreeStockChart.module.css"
import { useSelector } from "../../redux/hooks";
import { useDispatch } from "react-redux";
import dayjs, { Dayjs } from "dayjs"
import { strictEqual } from "assert"
import { BuySellItem, ChanCenterItem, ChanPointItem, codeMap, genBiPointList, genBuySellPoint, genCenterList, genKPriceUrl, genMACDData, genMAData, hkCodeMap, KItem, MAItem, parseDailyData, parseMinData } from "../../redux/kprice/slice"
import axios from "axios"
import { debounce } from 'lodash'
import HighchartsMore from 'highcharts/highcharts-more';
import Annotations from 'highcharts/modules/annotations';

// 加载模块
HighchartsMore(Highcharts);
Annotations(Highcharts);

const { RangePicker } = DatePicker;

export const ThreeStockChart: React.FC = () => {
    const [code, setCode] = useState<string>("000688") 
    const codeDic = useSelector((state) => state.periodChange.codeNameDic);
    const [biEnable,setBiEnable] = useState<boolean>(true) 
    const [centerEnable,setCenterEnable] = useState<boolean>(true)
    const [buySellEnable, setBuySellEnable] = useState<boolean>(true)
    // const [leftBuySellPointList, setLeftBuySellPointList] = useState<BuySellItem[]>([])
    // const [middleBuySellPointList, setMiddleBuySellPointList] = useState<BuySellItem[]>([])
    // const [rightBuySellPointList, setRightBuySellPointList] = useState<BuySellItem[]>([])
    const [buySellPointList, setRightBuySellPointList] = useState<BuySellItem[]>([])
    const [labelEnable, setLabelEnable] = useState<boolean>(false)
    const [markEnable, setMarkEnable] = useState<boolean>(false)
    const [macdEnable,setMacdEnable] = useState<boolean>(false)
    const [leftMacdValue, setLeftMacdValue] = useState<number>(30)
    const [middleMacdValue, setMiddleMacdValue] = useState<number>(20)
    const [rightMacdValue, setRightMacdValue] = useState<number>(20)
    const [updaterValue, setUpdaterValue] = useState<number>(0)
    const [updaterTimer, setUpdaterTimer] = useState<number>(0)
    const updaterTimerRef = useRef(0);
    updaterTimerRef.current = updaterTimer
    const [updaterTimerFlag,setUpdaterTimerFlag] = useState<boolean>(false)
    
    const biStyle = biEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const centerStyle = centerEnable ? {color: "#FF6A6A"} : {color: "gray"};
    const labelStyle = labelEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const macdStyle = macdEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const markStyle = markEnable ? {color:"#FF6A6A"} : {color:"gray"}; 
    const buysellStyle = buySellEnable ? {color:"#FF6A6A"} : {color:"gray"}; 
    let refreshColor = updaterTimerFlag ? "#FF0000" : "#1E90FF";
    const [leftRangeName, setLeftRangeName] = useState<string>("一个月");
    const [middleRangeName, setMiddleRangeName] = useState<string>("七天");
    const [rightRangeName, setRightRangeName] = useState<string>("一天");
    //左边按一个月算，中间3天，右边一天算时间
    const daystr = getCurrentDateFormatted(0,0)
    const monthstr = getCurrentDateFormatted(30,0)
    let leftStartStr = monthstr + "090000"
    let leftEndStr = daystr + "200000"
    const threeDaystr = getCurrentDateFormatted(7,0)
    let middleStartStr = threeDaystr + "090000"
    let middleEndStr = daystr + "200000"
    const oneDaystr = getCurrentDateFormatted(1,0)
    let rightStartStr = oneDaystr + "090000"
    let rightEndStr = daystr + "200000"

    const [leftDateRange, setLeftDateRange] = useState<[Dayjs, Dayjs]>([dayjs(leftStartStr),dayjs(leftEndStr)]);
    const [middleDateRange, setMiddleDateRange] = useState<[Dayjs, Dayjs]>([dayjs(middleStartStr),dayjs(middleEndStr)]);
    const [rightDateRange, setRightDateRange] = useState<[Dayjs, Dayjs]>([dayjs(rightStartStr), dayjs(rightEndStr)]);
    const [leftStartTime,setLeftStartTime] = useState<string>(leftStartStr)
    const [middleStartTime,setMiddleStartTime] = useState<string>(middleStartStr)
    const [rightStartTime, setRightStartTime] = useState<string>(rightStartStr)
    const [leftEndTime,setLeftEndTime] = useState<string>(leftEndStr)
    const [middleEndTime,setMiddleEndTime] = useState<string>(middleEndStr)
    const [rightEndTime, setRightEndTime] = useState<string>(rightEndStr)
    const dateFormat = 'YYYYMMDDHHmmss';
    const [leftPeriod, setLeftPeriod] = useState<string>("30")
    const [middlePeriod, setMiddlePeriod] = useState<string>("5")
    const [rightPeriod, setRightPeriod] = useState<string>("1")
    const [leftPeriodName, setLeftPeriodName] = useState<string>("30分钟线")
    const [middlePeriodName, setMiddlePeriodName] = useState<string>("5分钟线")
    const [rightPeriodName, setRightPeriodName] = useState<string>("1分钟线")
    const dispatch = useDispatch();
    const [chartHeight, setChartHeight] = useState<string>('750px')
    const ma5Color = "#FAD700"
    const ma10Color = "#40E0CD"
    const ma20Color = "#0000FF"
    const ma90Color = "#A52A2A"
    const ma250Color = "#EE82EE"
    const [middleMa5Value, setMiddleMa5Value] = useState<number>(0)
    const [middleMa10Value, setMiddleMa10Value] = useState<number>(0)
    const [middleMa20Value, setMiddleMa20Value] = useState<number>(0)
    const [middleMa90Value, setMiddleMa90Value] = useState<number>(0) 
    const [middleMa250Value, setMiddleMa250Value] = useState<number>(0) 
    const [middleCurValue, setMiddleCurValue] = useState<number>(0)
    const [middleCurRange, setMiddleCurRange] = useState<string>("")
    const [middleRangeColor, setMiddleRangeColor] = useState<string>("#FF0000") 

    const [leftMa5Value, setLeftMa5Value] = useState<number>(0)
    const [leftMa10Value, setLeftMa10Value] = useState<number>(0)
    const [leftMa20Value, setLeftMa20Value] = useState<number>(0)
    const [leftMa90Value, setLeftMa90Value] = useState<number>(0) 
    const [leftMa250Value, setLeftMa250Value] = useState<number>(0)  
    const [leftCurValue, setLeftCurValue] = useState<number>(0)
    const [leftCurRange, setLeftCurRange] = useState<string>("")
    const [leftRangeColor, setLeftRangeColor] = useState<string>("#FF0000") 

    const [rightMa5Value, setRightMa5Value] = useState<number>(0)
    const [rightMa10Value, setRightMa10Value] = useState<number>(0)
    const [rightMa20Value, setRightMa20Value] = useState<number>(0)
    const [rightMa90Value, setRightMa90Value] = useState<number>(0) 
    const [rightMa250Value, setRightMa250Value] = useState<number>(0) 
    const [rightCurValue, setRightCurValue] = useState<number>(0)
    const [rightCurRange, setRightCurRange] = useState<string>("")
    const [rightRangeColor, setRightRangeColor] = useState<string>("#FF0000") 


    useEffect(() => {
        if(navigator.userAgent.indexOf('Windows') > -1) {
            setChartHeight('500px')
        } else {
            setChartHeight('750px') 
        }
    }, []);
    const fetchAllData = () => {
        console.log('refresh three chart')
        fetchKPrice(code, "left")
        fetchKPrice(code, "middle")
        fetchKPrice(code, "right")
    }
    const fetchAllWithDebounce = debounce(fetchAllData, 200)
    useEffect(() => {
        fetchAllWithDebounce()
    }, [updaterTimer, updaterValue, 
        code, macdEnable, biEnable, 
        centerEnable, labelEnable, markEnable, buySellEnable ]);


    const fetchLeftData = () => {
        console.log('refresh left chart')
        fetchKPrice(code, "left")
    }
    const fetchLeftWithDebounce = debounce(fetchLeftData, 200) 
    useEffect(() => {
        fetchLeftWithDebounce()
    }, [leftStartTime, leftEndTime, leftPeriod, leftMacdValue]); 

    const fetchMiddleData = () => {
        console.log('refresh middle chart')
        fetchKPrice(code, "middle")
    }
    const fetchMiddleWithDebounce = debounce(fetchMiddleData, 200) 

    useEffect(() => {
       fetchMiddleWithDebounce() 
    }, [middleStartTime, middleEndTime, middlePeriod, middleMacdValue]); 

    const fetchRightData = () => {
        console.log('refresh right chart')
        fetchKPrice(code, "right")
    }
    const fetchRightWithDebounce = debounce(fetchRightData, 200) 
    useEffect(() => {
        fetchRightWithDebounce()
    }, [rightStartTime, rightEndTime, rightPeriod, rightMacdValue]); 

    async function fetchKPrice(code:string, mode: "left" | "right" | "middle") {
        let url = ""
        let period = ""
        let start = ""
        let end = ""
        if(mode == "left") {
            period = leftPeriod
            start = leftStartTime
            end = leftEndTime
        } else if (mode == "right") {
            period = rightPeriod
            start = rightStartTime
            end = rightEndTime
        } else {
            period = middlePeriod
            start = middleStartTime
            end = middleEndTime
        }
        if(period == 'weekly' || period == 'daily') {
            if (start.length > 8) {
                //去除时分秒
                start = start.substring(0,8)
            }
            if (end.length > 8) {
                end= end.substring(0,8)
            }
            url = genKPriceUrl('day', 'stock')
            if (codeMap.includes(code)){
                url = genKPriceUrl('day', 'etf')
            } else if (hkCodeMap.includes(code)) {
                url = genKPriceUrl('day','hk')
            } 
        } else {
            url = genKPriceUrl('min', 'stock')
            if (codeMap.includes(code)){
                url = genKPriceUrl('min', 'etf')
            } else if (hkCodeMap.includes(code)) {
                url = genKPriceUrl('min', 'hk')
            } 
        }
        url = url + `?symbol=${code}&period=${period}&start_date=${start}&end_date=${end}`;
        console.log(url)
        const analyse_buy_sell = buySellEnable && period === '1' 
        const { data } = await axios.get(url);
        let priceList:KItem[] = []
        if (period == 'daily' || period == 'weekly') {
            priceList = parseDailyData(data);
        } else {
            priceList = parseMinData(data, code);
        }
        const macd_dic = genMACDData(priceList);
        const ma5 = genMAData(priceList, 5)
        const ma10 = genMAData(priceList, 10)
        const ma20 = genMAData(priceList, 20)
        const ma90  = genMAData(priceList, 90)
        const ma250 = genMAData(priceList, 250)
        const ma_5 = macdEnable ?  ma5: [];
        const ma_10 = macdEnable ?  ma10: [];
        const ma_20 = macdEnable ?  ma20: [];
        const ma_90 = macdEnable ?  ma90 : []; 
        const ma_250 = macdEnable ?  ma250: [];
        let macdValue = leftMacdValue
        let lastBuySellItem: null|BuySellItem = buySellPointList.length <= 0 ? null : buySellPointList[buySellPointList.length-1] 
        if (mode == "left") {
            if (ma5.length > 0) setLeftMa5Value(ma5[ma5.length - 1].close);
            if (ma10.length > 0) setLeftMa10Value(ma10[ma10.length - 1].close);
            if (ma20.length > 0) setLeftMa20Value(ma20[ma20.length - 1].close);
            if (ma90.length > 0) setLeftMa90Value(ma90[ma90.length - 1].close);
            if (ma250.length > 0) setLeftMa250Value(ma250[ma250.length - 1].close);
            if (priceList.length > 0) {
                setLeftCurValue(priceList[priceList.length - 1].close) 
                if (priceList[priceList.length - 1].range) {
                    setLeftCurRange(priceList[priceList.length - 1].range + '%')
                } else {
                    setLeftCurRange('')
                }
                const color = priceList[priceList.length - 1].range > 0 ? "#FF0000" : "#00FF00"
                setLeftRangeColor(color)
            }
        } else if (mode == 'middle') {
            if (ma5.length > 0) setMiddleMa5Value(ma5[ma5.length - 1].close);
            if (ma10.length > 0) setMiddleMa10Value(ma10[ma10.length - 1].close);
            if (ma20.length > 0) setMiddleMa20Value(ma20[ma20.length - 1].close);
            if (ma90.length > 0) setMiddleMa90Value(ma90[ma90.length - 1].close);
            if (ma250.length > 0) setMiddleMa250Value(ma250[ma250.length - 1].close);
            if (priceList.length > 0) {
                setMiddleCurValue(priceList[priceList.length - 1].close) 
                if (priceList[priceList.length - 1].range) {
                    setMiddleCurRange(priceList[priceList.length - 1].range + '%')
                } else {
                    setMiddleCurRange('')
                }
                const color = priceList[priceList.length - 1].range > 0 ? "#FF0000" : "#00FF00"
                setMiddleRangeColor(color)
            } 
            macdValue = middleMacdValue
        } else if (mode == 'right') {
            if (ma5.length > 0) setRightMa5Value(ma5[ma5.length - 1].close);
            if (ma10.length > 0) setRightMa10Value(ma10[ma10.length - 1].close);
            if (ma20.length > 0) setRightMa20Value(ma20[ma20.length - 1].close);
            if (ma90.length > 0) setRightMa90Value(ma90[ma90.length - 1].close);
            if (ma250.length > 0) setRightMa250Value(ma250[ma250.length - 1].close);
            if (priceList.length > 0) {
                setRightCurValue(priceList[priceList.length - 1].close) 
                if (priceList[priceList.length - 1].range) {
                    setRightCurRange(priceList[priceList.length - 1].range + '%')
                } else {
                    setRightCurRange('')
                }
                const color = priceList[priceList.length - 1].range > 0 ? "#FF0000" : "#00FF00"
                setRightRangeColor(color)
            } 
            macdValue = rightMacdValue
        }
        const macd_dif = macd_dic.dif
        const macd_dea = macd_dic.dea
        const macd = macd_dic.macd
        const bi = biEnable ? genBiPointList(priceList) : [];
        const center = centerEnable ? genCenterList(bi) : [];
        const buySellItems = analyse_buy_sell ? genBuySellPoint(bi,center, 
            priceList[priceList.length-1],
            macd_dif,
            macd_dea,
            macd,
             lastBuySellItem,period): [];
        if (buySellItems.length > 0) {
            buySellPointList.push(buySellItems[buySellItems.length - 1])
        }
        const type = (period == 'weekly' || period == 'daily') ? 'daily' : "min"
        const trueData = parseData(priceList, type);
        const maData5 = macdEnable ? parseMaData(ma_5) : [];
        const maData250 = macdEnable ? parseMaData(ma_250) : [];
        const maData10 = macdEnable ? parseMaData(ma_10) : [];
        const maData20 = macdEnable ? parseMaData(ma_20) : [];
        const maData90 = macdEnable ? parseMaData(ma_90) : [];
        const { chartDataUp, chartDataDown } = parseVolData(priceList);
        const { chartMACD_RED, chartMACD_GREEN, chartDIF, chartDEA, max, min } = parseMACD(macd, macd_dif, macd_dea);
        const chanBi = biEnable ? parseChanBi(bi) : [];
        const centerShapes =centerEnable ? parseChanCenter(center) : [];
        const markValues = parseMarkLine(markEnable);
        let labels =labelEnable ? parseChanBiLabel(bi) : [];
        const buyselllabels = analyse_buy_sell ? parseBuySellPointLabel(buySellPointList):[];
        labels = labels.concat(buyselllabels)
        let periodtitle = period
        if (period == 'weekly') {
            periodtitle = '周线'
        } else if (period == 'daily') {
            periodtitle = '日线'
        } else {
            periodtitle = periodtitle + '分钟'
        }
        const codeName = codeDic[code] != null ? `${codeDic[code]}--${periodtitle}走势图` : `${code}--${periodtitle}走势图`
        document.title = codeDic[code] != null ? `${codeDic[code]}走势图` : `${code}走势图` 
        const options = genChartDatas(chartHeight,codeName,macdValue,
            trueData, maData5, ma5Color, maData10,ma10Color,
            maData20,ma20Color,maData90,ma90Color,maData250,ma250Color,
            chartDataUp, chartDataDown, chartMACD_RED,
            chartMACD_GREEN,chartDIF,chartDEA,chanBi,centerShapes,labels,markValues)
        if (mode == "left") {
            setLeftOptions(options)
        } else if (mode == "middle") {
            setMiddleOptions(options)
        } else {
            setRightOptions(options)
        }
    }
    
    const defaultOption = genChartDatas(chartHeight, "", leftMacdValue, 
        [],[],ma5Color,[],ma10Color,[],ma20Color,[],ma90Color,[],ma250Color,
        [],[],[],[],[],[],[],[],[],parseMarkLine(false))
    const [leftOptions, setLeftOptions] = useState<any>(defaultOption)
    const [middleOptions, setMiddleOptions] = useState<any>(defaultOption)
    const [rightOptions, setRightOptions] = useState<any>(defaultOption)

    function genChartDatas(chartHeight, title, macdValue, trueData, 
        maData5, ma5Color, maData10, ma10Color, maData20, ma20Color, 
        maData90, ma90Color,maData250, ma250Color,chartDataUp, chartDataDown,
        chartMACD_RED,chartMACD_GREEN,chartDIF, chartDEA,chanBi,centerShapes,labels, markValues) {
        const options = {
            chart: {
                height: chartHeight 
    
            },
            rangeSelector: {
                selected: 2
            },
            title: {
                text: title
            },
            xAxis: markValues,
            yAxis: [{
                title: {
                    text: "价格"
                },
                height: '70%'
    
    
            }, {
                title: {
                    text: "MACD"
                },
                height: '15%',
                top: '70%',
                max: macdValue/10.0,
                min: -macdValue/10.0,
    
            }, {
                title: {
                    text: "成交量"
                },
                height: '15%',
                top: '85%',
    
            }],
            series: [{
                id: 'appl',
                type: 'candlestick',
                name: 'K线数据',
                data: trueData,
                tooltip: {
                    enabled: false,
                },
                color: "#00FF00",
                upColor: '#FF0000',
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
            }
                , {
                type: 'line',
                name: '移动平均线-MA5',
                data: maData5,
                tooltip: {
                    valueDecimals: 2
                },
                color: ma5Color
            }
                , {
                type: 'line',
                name: '移动平均线-MA10',
                data: maData10,
                tooltip: {
                    valueDecimals: 2
                },
                color: ma10Color
            }
                , {
                type: 'line',
                name: '移动平均线-MA20',
                data: maData20,
                tooltip: {
                    valueDecimals: 2
                },
                color: ma20Color
            }
                , {
                type: 'line',
                name: '移动平均线-MA90',
                data: maData90,
                tooltip: {
                    valueDecimals: 2
                },
                color: ma90Color
            }
                , {
                type: 'line',
                name: '移动平均线-MA250',
                data: maData250,
                tooltip: {
                    valueDecimals: 2
                },
                color: ma250Color
            }
                , {
                type: "column",
                name: '成交量',
                data: chartDataUp,
                yAxis: 2,
                color: "#FF0000",
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
    
            }
            , {
                type: "column",
                name: '成交量',
                data: chartDataDown,
                yAxis: 2,
                color: "#00FF00",
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
    
            }
                , {
                type: "column",
                name: 'MACD',
                data: chartMACD_RED,
                yAxis: 1,
                color: "#FF0000",
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
    
            }
                , {
                type: "column",
                name: 'MACD',
                data: chartMACD_GREEN,
                yAxis: 1,
                color: "#00FF00",
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
    
            }
                , {
                type: "line",
                name: 'MACD-DIF',
                data: chartDIF,
                yAxis: 1,
                color: "#0000FF",
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
    
            }
                , {
                type: "line",
                name: 'MACD-DEA',
                data: chartDEA,
                yAxis: 1,
                color: "#FAD700",
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
    
            }
            , {
                type: "line",
                name: 'chan-bi',
                data: chanBi,
                yAxis: 0,
                color: "#000000",
                dataGrouping: {
                    enabled: false // 禁用数据分组
                }
            }
            ],
            annotations: [{
                shapes:centerShapes,
                labels:labels
    
            }]
        };
        return options
    }
    
    const menuItems = periodList.map((item) => {
        return { label: item.name, key: item.period };
    });
    const leftMenuProps = {
        items: menuItems,
        onClick: handleLeftMenuClick,
    };
    const middleMenuProps = {
        items: menuItems,
        onClick: handleMiddleMenuClick,
    };
    const rightMenuProps = {
        items: menuItems,
        onClick: handleRightMenuClick,
    }

    const rangeItems = rangeList.map((item) => {
        return { label: item.name, key: item.key };
    });

    const leftRangeMenuProps = {
        items:rangeItems,
        onClick: handleLeftRangeMenuClick,
    };
    const middleRangeMenuProps = {
        items:rangeItems,
        onClick: handleMiddleRangeMenuClick,
    };
    const rightRangeMenuProps = {
        items:rangeItems,
        onClick: handleRightRangeMenuClick,
    };

    const handleCodeChange = (keyword) => {
        if (keyword && (keyword.length === 6 || keyword.length === 5)) {
            // console.log("code is ", keyword);
            setCode(keyword)
        } else {
            console.log("invalid code")
        }
    }
    const handleMACDClick = () => {
        setMacdEnable(!macdEnable)
    };
    const handleLabelClick = () => {
        setLabelEnable(!labelEnable)
    };
    const handleBiClick = () => {
        setBiEnable(!biEnable)
    };
    const handleCenterClick = () => {
        setCenterEnable(!centerEnable)
    };
    const handleBuySellClick = () => {
        setBuySellEnable(!buySellEnable)
    }
    const handleMarkClick = () => {
        setMarkEnable(!markEnable)
    }
    const LeftMACDValueChange = (value: number | null) => {
        if (value != null) {
            setLeftMacdValue(value)
        }
    };
    const MiddleMACDValueChange = (value: number | null) => {
        if (value != null) {
            setMiddleMacdValue(value)
        }
    }
    const RightMACDValueChange = (value: number | null) => {
        if (value != null) {
            setRightMacdValue(value)
        }
    }
    const handleRefreshClick = () => {
        setUpdaterValue(updaterValue + 1)
    };
    const handleRefreshTimerClick = () => {
        const flag = updaterTimerFlag;    
        setUpdaterTimerFlag(!flag)
        if(!flag) {
            startUpdating();
        } else {
            stopUpdating();
        }
    };
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const startUpdating = () => {
        stopUpdating();
        if(!intervalId){
            const id = setInterval(() => {
                const num = updaterTimerRef.current + 1;
                setUpdaterTimer(num)
                updaterTimerRef.current = num
            }, 5000);
            setIntervalId(id);
        }
    };

    const stopUpdating  = () => {
        if (intervalId) {
            console.log("stop timer")
            clearInterval(intervalId);
            setIntervalId(null);
        }
    }
    
    const handleLeftTimeChange = (val) => {
        setLeftDateRange(val)
        if (val && val.length == 2) {
            const startStr = val[0].format(dateFormat);
            const endStr = val[1].format(dateFormat);
            //  console.log("time change", startStr, endStr);
            setLeftStartTime(startStr)
            setLeftEndTime(endStr)
        } else {
            console.log("invalid date", val);
        }
    };
    const handleMiddleTimeChange = (val) => {
        setMiddleDateRange(val)
        if (val && val.length == 2) {
            const startStr = val[0].format(dateFormat);
            const endStr = val[1].format(dateFormat);
            //  console.log("time change", startStr, endStr);
            setMiddleStartTime(startStr)
            setMiddleEndTime(endStr)
        } else {
            console.log("invalid date", val);
        }
    };
    const handleRightTimeChange = (val) => {
        setRightDateRange(val)
        if (val && val.length == 2) {
            const startStr = val[0].format(dateFormat);
            const endStr = val[1].format(dateFormat);
            //  console.log("time change", startStr, endStr);
            setRightStartTime(startStr)
            setRightEndTime(endStr)
        } else {
            console.log("invalid date", val);
        }
    };
    function handleLeftMenuClick(e) {
        setLeftPeriod(genPeriodUrlKey(e.key))
        const name = getPeriodName(e.key)
        setLeftPeriodName(name)
    };
    function handleMiddleMenuClick(e) {
        setMiddlePeriod(genPeriodUrlKey(e.key))
        const name = getPeriodName(e.key)
        setMiddlePeriodName(name)
    };
    function handleRightMenuClick(e) {
        setRightPeriod(genPeriodUrlKey(e.key))
        const name = getPeriodName(e.key)
        setRightPeriodName(name)
    };
    function genStartStr(e, daystr) {
        let startStr = daystr + "090000"
        if (e.key == "Day_1") {
            // nothing
        } else if (e.key == "Day_1_half") {
            const daystr = getCurrentDateFormatted(1,0)
            startStr = daystr + "130000"
        } else if (e.key == "Day_2") {
            const daystr = getCurrentDateFormatted(2,0)
            startStr = daystr + "090000"
        } else if (e.key == "Day_3") {
            const day3str = getCurrentDateFormatted(3,0)
            startStr = day3str + "090000"
        } else if (e.key == "Day_7") {
            const day3str = getCurrentDateFormatted(7,0)
            startStr = day3str + "090000"
        } else if (e.key == "Month_1") {
            const monthstr = getCurrentDateFormatted(30,0)
            startStr = monthstr + "090000"
        } else if (e.key == "Month_3") {
            const month3str = getCurrentDateFormatted(90,0)
            startStr = month3str + "090000"
        } else if (e.key == "Month_6") {
            const month6str = getCurrentDateFormatted(180,0)
            startStr = month6str + "090000"
        } else if (e.key == "Year_1") {
            const yearstr = getCurrentDateFormatted(365,0)
            startStr = yearstr + "090000"
        }
        return startStr
    }
    function handleLeftRangeMenuClick(e) {
        const daystr = getCurrentDateFormatted(0,0)
        let startStr = daystr + "090000"
        let endStr = daystr + "200000"
        let name = findRangeName(e.key)
        startStr = genStartStr(e, daystr)
        setLeftRangeName(name)
        setLeftStartTime(startStr)
        setLeftEndTime(endStr)
        setLeftDateRange([dayjs(startStr), dayjs(endStr)])
    };
    function handleMiddleRangeMenuClick(e) {
        const daystr = getCurrentDateFormatted(0,0)
        let startStr = daystr + "090000"
        let endStr = daystr + "200000"
        let name = findRangeName(e.key)
        startStr = genStartStr(e, daystr)
        setMiddleRangeName(name)
        setMiddleStartTime(startStr)
        setMiddleEndTime(endStr)
        setMiddleDateRange([dayjs(startStr), dayjs(endStr)])
    };
    function handleRightRangeMenuClick(e) {
        const daystr = getCurrentDateFormatted(0,0)
        let startStr = daystr + "090000"
        let endStr = daystr + "200000"
        let name = findRangeName(e.key)
        startStr = genStartStr(e, daystr)
        setRightRangeName(name)
        setRightStartTime(startStr)
        setRightEndTime(endStr)
        setRightDateRange([dayjs(startStr), dayjs(endStr)])
    };
    return  <div className={styles.content}>
       <div className={styles.searchContent}>
            <Typography.Text className={styles.searchLabel}>股票代码</Typography.Text>
            <Input.Search className={styles.searchInput} placeholder="输入代码" defaultValue={code} onSearch={handleCodeChange}></Input.Search>
            <Button type="text" onClick={handleMACDClick} style={macdStyle}>MA</Button>
            <Button type="text" onClick={handleLabelClick} style={labelStyle}>标签</Button>
            <Button type="text" onClick={handleBiClick} style={biStyle}>笔</Button>
            <Button type="text" onClick={handleCenterClick} style={centerStyle}>中枢</Button>
            <Button type="text" onClick={handleMarkClick} style={markStyle}>刻度</Button> 
            <Button type="text" onClick={handleBuySellClick} style={buysellStyle}>买卖点</Button>
            <Button type="text" onClick={handleRefreshClick} style={{color: "#1E90FF", width:30, marginLeft: 12}}>刷新</Button>
            <Button type="text" onClick={handleRefreshTimerClick} style={{color: refreshColor,marginLeft: 12, width: 50}}>{updaterTimerFlag ? "停止刷新": "定时刷新"}</Button>
        </div> 
        <Row className={styles.row}>
            <Col span={8} className={styles.col}>
                <div className={styles.searchContent}>
                    <Dropdown.Button menu={leftMenuProps} onClick={handleLeftMenuClick} className={styles.searchMenu}>
                        {leftPeriodName}
                    </Dropdown.Button>
                    <RangePicker showTime onChange={handleLeftTimeChange} value={leftDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 8}}></RangePicker>
                    <Dropdown.Button menu={leftRangeMenuProps} onClick={handleLeftRangeMenuClick} className={styles.searchMenu}>
                        {leftRangeName}
                    </Dropdown.Button>
                    <InputNumber defaultValue={leftMacdValue} min={0} max={500} onChange={LeftMACDValueChange} style={{marginLeft: 0, width: 70}}></InputNumber>
                </div>
                <div className={styles.maValue}>
                    <Typography.Text style={{marginLeft: 12, color: ma5Color}}>MA5 {leftMa5Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma10Color}}>MA10 {leftMa10Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma20Color}}>MA20 {leftMa20Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma90Color}}>MA90 {leftMa90Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma250Color}}>MA250 {leftMa250Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: "#FF0000"}}>现价 {leftCurValue}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: leftRangeColor}}>涨幅 {leftCurRange}</Typography.Text> 
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={'stockChart'}
                    options={leftOptions}
                />
                
            </Col>
            <Col span={8} className={styles.col}>
                <div className={styles.searchContent}>
                    <Dropdown.Button menu={middleMenuProps} onClick={handleMiddleMenuClick} className={styles.searchMenu}>
                        {middlePeriodName}
                    </Dropdown.Button>
                    <RangePicker showTime onChange={handleMiddleTimeChange} value={middleDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 8}}></RangePicker>
                    <Dropdown.Button menu={middleRangeMenuProps} onClick={handleMiddleRangeMenuClick} className={styles.searchMenu}>
                        {middleRangeName}
                    </Dropdown.Button>
                    <InputNumber defaultValue={middleMacdValue} min={0} max={500} onChange={MiddleMACDValueChange} style={{marginLeft: 0, width: 70}}></InputNumber>

                </div> 
                <div className={styles.maValue}>
                    <Typography.Text style={{marginLeft: 12, color: ma5Color}}>MA5 {middleMa5Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma10Color}}>MA10 {middleMa10Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma20Color}}>MA20 {middleMa20Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma90Color}}>MA90 {middleMa90Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma250Color}}>MA250 {middleMa250Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: "#FF0000"}}>现价 {middleCurValue}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: middleRangeColor}}>涨幅 {middleCurRange}</Typography.Text> 
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={'stockChart'}
                    options={middleOptions}
                />
            </Col>
            <Col span={8} className={styles.col}>
                <div className={styles.searchContent}>
                    <Dropdown.Button menu={rightMenuProps} onClick={handleRightMenuClick} className={styles.searchMenu}>
                        {rightPeriodName}
                    </Dropdown.Button>
                    <RangePicker showTime onChange={handleRightTimeChange} value={rightDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 8}}></RangePicker>
                    <Dropdown.Button menu={rightRangeMenuProps} onClick={handleRightRangeMenuClick} className={styles.searchMenu}>
                        {rightRangeName}
                    </Dropdown.Button>
                    <InputNumber defaultValue={rightMacdValue} min={0} max={500} onChange={RightMACDValueChange} style={{marginLeft: 0, width: 70}}></InputNumber>
                </div> 
                <div className={styles.maValue}>
                    <Typography.Text style={{marginLeft: 12, color: ma5Color}}>MA5 {rightMa5Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma10Color}}>MA10 {rightMa10Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma20Color}}>MA20 {rightMa20Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma90Color}}>MA90 {rightMa90Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: ma250Color}}>MA250 {rightMa250Value}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: "#FF0000"}}>现价 {rightCurValue}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: rightRangeColor}}>涨幅 {rightCurRange}</Typography.Text> 
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={'stockChart'}
                    options={rightOptions}
                />
            </Col>
        </Row>

    </div>
}

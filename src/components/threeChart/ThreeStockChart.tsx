
import { Button, Col, DatePicker, Dropdown, InputNumber, Row } from "antd"
import Input from "antd/es/input"
import Item from "antd/es/list/Item"
import HighchartsReact from "highcharts-react-official";
import Highcharts, { dateFormat, numberFormat, setOptions } from 'highcharts/highstock';
import Typography from "antd/es/typography"
import React, { useEffect, useRef, useState } from "react"
import { findRangeName, genPeriodUrlKey, getCurrentDateFormatted,
     getNextPeriod,
     getPeriodName, getRangeTime, parseBuySellLines, parseBuySellPointLabel, parseBuySellPointLabelV2, parseChanBi, parseChanBiLabel, parseChanCenter,
      parseData, parseMACD, parseMaData, parseMarkLine, parseVolData, periodList, rangeList } from "../chart/StockChart"
import styles from "./ThreeStockChart.module.css"
import { useSelector } from "../../redux/hooks";
import { useDispatch } from "react-redux";
import dayjs, { Dayjs } from "dayjs"
import { strictEqual } from "assert"
import { BuySellItem, BuySellV2, capitalInfoUrl, CapitalItem, ChanCenterItem, ChanPointItem, codeMap, dailyPriceUrl, DayPriceItem, genBiPointList, genBuySellPoint, genBuySellPointV2, genCenterList, genKPriceUrl, genMACDData, genMAData, hkCodeMap, KItem, MAItem, parseCapital, parseDailyData, parseDailyPrice, parseMinData, showTips } from "../../redux/kprice/slice"
import axios from "axios"
import { debounce } from 'lodash'
import HighchartsMore from 'highcharts/highcharts-more';
import Annotations from 'highcharts/modules/annotations';
import { Howl } from 'howler';
import { Radio } from 'antd';
// 加载模块
HighchartsMore(Highcharts);
Annotations(Highcharts);

const { RangePicker } = DatePicker;



export const ThreeStockChart: React.FC = (props) => {
    const [code, setCode] = useState<string>("000688") 
    const codeDic = useSelector((state) => state.periodChange.codeNameDic);
    const [biEnable,setBiEnable] = useState<boolean>(true) 
    const [centerEnable,setCenterEnable] = useState<boolean>(true)
    const [buySellEnable, setBuySellEnable] = useState<boolean>(true)
    const [labelEnable, setLabelEnable] = useState<boolean>(false)
    const [macdEnable,setMacdEnable] = useState<boolean>(false)
    const [leftMacdValue, setLeftMacdValue] = useState<number>(0)
    const [middleMacdValue, setMiddleMacdValue] = useState<number>(0)
    const [rightMacdValue, setRightMacdValue] = useState<number>(0)
    const [updaterValue, setUpdaterValue] = useState<number>(0)
    const [updaterTimer, setUpdaterTimer] = useState<number>(0)
    const updaterTimerRef = useRef(0);
    updaterTimerRef.current = updaterTimer
    const [updaterTimerFlag,setUpdaterTimerFlag] = useState<boolean>(false)
    const isMobile = useSelector((state) => state.periodChange.isMobile);
    const isSmallPC = useSelector((state) => state.periodChange.isSmallPC);  
    
    const biStyle = biEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const centerStyle = centerEnable ? {color: "#FF6A6A"} : {color: "gray"};
    const labelStyle = labelEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const macdStyle = macdEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const buysellStyle = buySellEnable ? {color:"#FF6A6A"} : {color:"gray"}; 
    const maFontSize = isMobile? "10px" : "14px"
    let refreshColor = updaterTimerFlag ? "#FF0000" : "#1E90FF";
    const [leftRangeName, setLeftRangeName] = useState<string>("六个月");
    const [middleRangeName, setMiddleRangeName] = useState<string>("一个月");
    const [rightRangeName, setRightRangeName] = useState<string>("三天");
    //左边按一个月算，中间3天，右边一天算时间
    const daystr = getCurrentDateFormatted(0,0)
    const monthstr = getCurrentDateFormatted(30*6,0)
    let leftStartStr = monthstr + "090000"
    let leftEndStr = daystr + "200000"
    const threeDaystr = getCurrentDateFormatted(30,0)
    let middleStartStr = threeDaystr + "090000"
    let middleEndStr = daystr + "200000"
    const oneDaystr = getCurrentDateFormatted(3,0)
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
    const [leftPeriod, setLeftPeriod] = useState<string>("daily")
    const [middlePeriod, setMiddlePeriod] = useState<string>("30")
    const [rightPeriod, setRightPeriod] = useState<string>("5")
    const [leftPeriodName, setLeftPeriodName] = useState<string>("日线")
    const [middlePeriodName, setMiddlePeriodName] = useState<string>("30分钟线")
    const [rightPeriodName, setRightPeriodName] = useState<string>("5分钟线")
    const dispatch = useDispatch();
    const ma5Color = "#FAD700"
    const ma10Color = "#40E0CD"
    const ma20Color = "#0000FF"
    const ma120Color = "#A52A2A"
    const ma250Color = "#EE82EE"
    const [middleMa5Value, setMiddleMa5Value] = useState<number>(0)
    const [middleMa10Value, setMiddleMa10Value] = useState<number>(0)
    const [middleMa20Value, setMiddleMa20Value] = useState<number>(0)
    const [middleMa120Value, setMiddleMa120Value] = useState<number>(0) 
    const [middleMa250Value, setMiddleMa250Value] = useState<number>(0) 

    const [leftMa5Value, setLeftMa5Value] = useState<number>(0)
    const [leftMa10Value, setLeftMa10Value] = useState<number>(0)
    const [leftMa20Value, setLeftMa20Value] = useState<number>(0)
    const [leftMa120Value, setLeftMa120Value] = useState<number>(0) 
    const [leftMa250Value, setLeftMa250Value] = useState<number>(0)  

    const [rightMa5Value, setRightMa5Value] = useState<number>(0)
    const [rightMa10Value, setRightMa10Value] = useState<number>(0)
    const [rightMa20Value, setRightMa20Value] = useState<number>(0)
    const [rightMa120Value, setRightMa120Value] = useState<number>(0) 
    const [rightMa250Value, setRightMa250Value] = useState<number>(0) 
    const [leftBuySellDatas, setLeftBuySellDatas] = useState<BuySellV2[]>([])
    const [leftNeedCheck, setLeftNeedCheck] = useState<boolean>(false)
    const [leftKDatas, setLeftKDatas] = useState<KItem[]>([])
    const [middleKDatas, setMiddleKDatas] = useState<KItem[]>([])
    const [rightKDatas, setRightKDatas] = useState<KItem[]>([])
    const [middleBuySellDatas, setMiddleBuySellDatas] = useState<BuySellV2[]>([])
    const [middleNeedCheck, setMiddleNeedCheck] = useState<boolean>(false)
    const [rightBuySellDatas, setRightBuySellDatas] = useState<BuySellV2[]>([])
    const [rightNeedCheck, setRightNeedCheck] = useState<boolean>(false)

    const [price, setPrice] = useState<number>(0)
    const [priceRate, setPriceRate] = useState<number>(0)
    const [capital, setCapital] = useState<CapitalItem>({today: 0, threeDay: 0, fiveDay: 0, todayStr: '-', threeDayStr: '-', fiveDayStr: '-'})
    const [capitalColor, setCapitalColor] = useState<[string, string, string]>(['#FF0000','#FF0000','FF0000'])
    const [dayPrice, setDayPrice] = useState<DayPriceItem>({price: 0, rate: '0%', color: '#FF0000'})
    const [chartHeight, setChartHeight] = useState<string>(`${window.innerHeight - 230}px`)
    const [tipsText, setTipsText] = useState<string>("暂无买卖建议")
    const [tipsColor, setTipsColor] = useState<string>("#FF0000")
    const [openVoice, setOpenVoice] = useState<boolean>(false)
    
    const [viewMode, setViewMode] = useState<"one"|"two"|"three">("three")
    const [spanSize, setSpanSize] = useState<number>(8)
    const [leftMarkArray, setLeftMarkArray] = useState<string[]>([])
    const [middleMarkArray, setMiddleMarkArray] = useState<string[]>([])

    useEffect(() => {
        // 设置一个 3000 毫秒（即 3 秒）的延迟
        const leftHeight: number = isMobile ? window.innerHeight - 150 : window.innerHeight - 230; 
        const chartStr = `${leftHeight}px`
        setChartHeight(chartStr)  
    }, []);
    useEffect(() => {
        if(isMobile) {
            setViewMode("one")
            setSpanSize(24)
        } else if (isSmallPC) {
            setViewMode("two")
            setSpanSize(10)
        } else {
            setViewMode("three")
            setSpanSize(8)
        }
    }, [isMobile, isSmallPC]);
    
    const fetchAllData = () => {
        if(viewMode == "three") {
            fetchKPrice(code, "left")
            fetchKPrice(code, "middle")
            fetchKPrice(code, "right")
        } else if (viewMode == 'two') {
            fetchKPrice(code, "left")
            fetchKPrice(code, "middle")
        } else if (viewMode == 'one') {
            let period = getNextPeriod(leftPeriod)
            let rangeTime = getRangeTime(period)
            setMiddlePeriod(period)
            setMiddleStartTime(rangeTime[0])
            setMiddleEndTime(rangeTime[1])
            setMiddleDateRange([dayjs(rangeTime[0]), dayjs(rangeTime[1])])
            fetchKPrice(code, "left")
            fetchKPrice(code, "middle") 
        }
        fetchBaseInfo(code)
        fetchDailyInfo(code)
    }
    const fetchAllWithDebounce = debounce(fetchAllData, 200)

    
    const checkTips = () => {
        if(leftBuySellDatas.length < 1 || middleBuySellDatas.length < 1) return;
        let leftItem = leftBuySellDatas[leftBuySellDatas.length - 1]
        let middleItem = middleBuySellDatas[middleBuySellDatas.length - 1] 
        if(leftNeedCheck) {
            if(showTips(leftItem, leftPeriod,middleBuySellDatas) || (viewMode == "three" && showTips(leftItem, leftPeriod,rightBuySellDatas))) {
                let buyType = ""
                if(leftItem.type.startsWith('buy')) {
                    setTipsColor('#FF0000')
                    buyType = "buy"
                } else {
                    setTipsColor('#008000')
                    buyType = "sell"
                }
                
                let text = "买卖建议：" + leftPeriodName + leftItem.date + ':' + leftItem.type + ':' + leftItem.price
                let markItem = leftItem.date + '[' + buyType + ']'
                if(!leftMarkArray.includes(markItem)){
                    leftMarkArray.push(markItem)
                }
                setTipsText(text)
                if(openVoice) {
                    sound.play()
                    console.log('haojin test show voice')
                } 
                console.log(text)
            }
        } else if (viewMode == 'three' && middleNeedCheck && rightBuySellDatas.length > 0) {
            if(showTips(middleItem, middlePeriod,rightBuySellDatas)) {
                let buyType = ""
                if(middleItem.type.startsWith('buy')) {
                    setTipsColor('#FF0000')
                    buyType = "buy"
                } else {
                    setTipsColor('#008000')
                    buyType = "sell"
                }
                let text = "买卖建议：" + middlePeriodName + middleItem.date + ':' + middleItem.type + ":" + middleItem.price
                let markItem = middleItem.date + '[' + buyType + ']'
                if(!middleMarkArray.includes(markItem)){
                    middleMarkArray.push(markItem)
                }
                setTipsText(text)
                if(openVoice) {
                    sound.play()
                    console.log('haojin test show voice')
                }
                console.log(text)
            }
        }
    }
    useEffect(() => {
        fetchAllWithDebounce()
        checkTips()
    }, [updaterTimer, updaterValue, 
        code, macdEnable, biEnable, 
        centerEnable, labelEnable, buySellEnable ]);


    const fetchLeftData = () => {
        fetchKPrice(code, "left")
    }
    const fetchLeftWithDebounce = debounce(fetchLeftData, 200) 
    useEffect(() => {
        fetchLeftWithDebounce()
    }, [leftStartTime, leftEndTime, leftPeriod, leftMacdValue]); 

    const fetchMiddleData = () => {
        fetchKPrice(code, "middle")
    }
    const fetchMiddleWithDebounce = debounce(fetchMiddleData, 200) 

    useEffect(() => {
       fetchMiddleWithDebounce() 
    }, [middleStartTime, middleEndTime, middlePeriod, middleMacdValue]); 

    const fetchRightData = () => {
        fetchKPrice(code, "right")
    }
    const fetchRightWithDebounce = debounce(fetchRightData, 200) 
    useEffect(() => {
        fetchRightWithDebounce()
    }, [rightStartTime, rightEndTime, rightPeriod, rightMacdValue]); 

    async function fetchBaseInfo(code:string) {
        if (capital.todayStr === '-') {
            let url = capitalInfoUrl(code)
            const { data } = await axios.get(url); 
            let capitalItem = parseCapital(data) 
            setCapital(capitalItem)
            var todayColor = capitalItem.today > 0 ? "#FF0000" : '#006400';
            var threeDayColor = capitalItem.threeDay > 0 ? "#FF0000" : '#006400';
            var fiveDayColor = capitalItem.fiveDay > 0 ? "#FF0000" : '#006400';
            setCapitalColor([todayColor, threeDayColor, fiveDayColor])
        } 
    }

    async function fetchDailyInfo(code:string) {
       let url = dailyPriceUrl(code) 
       const { data } = await axios.get(url); 
       let priceItem = parseDailyPrice(data)
       setDayPrice(priceItem)

    }

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
        const test_enable = buySellEnable && period === '30'
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
        const ma120  = genMAData(priceList, 120)
        const ma250 = genMAData(priceList, 250)
        const ma_5 = macdEnable ?  ma5: [];
        const ma_10 = macdEnable ?  ma10: [];
        const ma_20 = macdEnable ?  ma20: [];
        const ma_120 = macdEnable ?  ma120 : []; 
        const ma_250 = macdEnable ?  ma250: [];
        let macdValue = leftMacdValue
        if (mode == "left") {
            if (ma5.length > 0) setLeftMa5Value(ma5[ma5.length - 1].close);
            if (ma10.length > 0) setLeftMa10Value(ma10[ma10.length - 1].close);
            if (ma20.length > 0) setLeftMa20Value(ma20[ma20.length - 1].close);
            if (ma120.length > 0) setLeftMa120Value(ma120[ma120.length - 1].close);
            if (ma250.length > 0) setLeftMa250Value(ma250[ma250.length - 1].close);
        } else if (mode == 'middle') {
            if (ma5.length > 0) setMiddleMa5Value(ma5[ma5.length - 1].close);
            if (ma10.length > 0) setMiddleMa10Value(ma10[ma10.length - 1].close);
            if (ma20.length > 0) setMiddleMa20Value(ma20[ma20.length - 1].close);
            if (ma120.length > 0) setMiddleMa120Value(ma120[ma120.length - 1].close);
            if (ma250.length > 0) setMiddleMa250Value(ma250[ma250.length - 1].close);
            macdValue = middleMacdValue
        } else if (mode == 'right') {
            if (ma5.length > 0) setRightMa5Value(ma5[ma5.length - 1].close);
            if (ma10.length > 0) setRightMa10Value(ma10[ma10.length - 1].close);
            if (ma20.length > 0) setRightMa20Value(ma20[ma20.length - 1].close);
            if (ma120.length > 0) setRightMa120Value(ma120[ma120.length - 1].close);
            if (ma250.length > 0) setRightMa250Value(ma250[ma250.length - 1].close);
            macdValue = rightMacdValue
        }
        const macd_dif = macd_dic.dif
        const macd_dea = macd_dic.dea
        const macd = macd_dic.macd
        const bi = biEnable ? genBiPointList(priceList) : [];
        const center = centerEnable ? genCenterList(bi) : [];
        const buySellItems = buySellEnable ? genBuySellPointV2(bi, center, priceList, macd_dif, macd_dea, macd) : [];
        const type = (period == 'weekly' || period == 'daily') ? 'daily' : "min"
        const trueData = parseData(priceList, type);
        const maData5 = macdEnable ? parseMaData(ma_5) : [];
        const maData250 = macdEnable ? parseMaData(ma_250) : [];
        const maData10 = macdEnable ? parseMaData(ma_10) : [];
        const maData20 = macdEnable ? parseMaData(ma_20) : [];
        const maData120 = macdEnable ? parseMaData(ma_120) : [];
        const { chartDataUp, chartDataDown } = parseVolData(priceList);
        const { chartMACD_RED, chartMACD_GREEN, chartDIF, chartDEA, max, min } = parseMACD(macd, macd_dif, macd_dea);
        let defaultMACDValue = Math.ceil(Math.max(Math.abs(max*100), Math.abs(min*100))/1.5)
        if (macdValue == 0) {
            macdValue = defaultMACDValue
        }
        const chanBi = biEnable ? parseChanBi(bi) : [];
        const centerShapes =centerEnable ? parseChanCenter(center) : [];
        let markValues = parseBuySellLines(false, [])
        if(mode == "left") {
            markValues = parseBuySellLines(buySellEnable, leftMarkArray);
        } else if (mode == "middle") {
            markValues = parseBuySellLines(buySellEnable, middleMarkArray)
        }
        
        let labels =labelEnable ? parseChanBiLabel(bi) : [];
        const buyselllabels = buySellItems.length>0 ? parseBuySellPointLabelV2(buySellItems):[];
        labels = labels.concat(buyselllabels)
        let periodtitle = period
        if (period == 'weekly') {
            periodtitle = '周线'
        } else if (period == 'daily') {
            periodtitle = '日线'
        } else {
            periodtitle = periodtitle + '分钟'
        }
        const codeName = codeDic[code] != null ? `${codeDic[code]}--${periodtitle}` : `${code}--${periodtitle}`
        document.title = codeDic[code] != null ? `${codeDic[code]}[${dayPrice.price}] [${dayPrice.rate}]` : `${code}[${dayPrice.price}] [${dayPrice.rate}]` 
        const options = genChartDatas(chartHeight,codeName,macdValue,
            trueData, maData5, ma5Color, maData10,ma10Color,
            maData20,ma20Color,maData120,ma120Color,maData250,ma250Color,
            chartDataUp, chartDataDown, chartMACD_RED,
            chartMACD_GREEN,chartDIF,chartDEA,chanBi,centerShapes,labels,markValues)
        let needCheck = false
        if(buySellItems.length > 0 && priceList.length > 0) {
            if(buySellItems[buySellItems.length - 1].index + 3 >= priceList[priceList.length - 1].index) {
                needCheck = true
            }
        } 
        if (mode == "left") {
            setLeftBuySellDatas(buySellItems)
            setLeftNeedCheck(needCheck)
            setLeftOptions(options)
            setLeftKDatas(priceList)
        } else if (mode == "middle") {
            setMiddleBuySellDatas(buySellItems)
            setMiddleNeedCheck(needCheck)
            setMiddleOptions(options)
            setMiddleKDatas(priceList)
        } else {
            setRightBuySellDatas(buySellItems)
            setRightNeedCheck(needCheck)
            setRightOptions(options)
            setRightKDatas(priceList)
        }
    }
    
    const defaultOption = genChartDatas(chartHeight, "", leftMacdValue, 
        [],[],ma5Color,[],ma10Color,[],ma20Color,[],ma120Color,[],ma250Color,
        [],[],[],[],[],[],[],[],[],parseMarkLine(false))
    const [leftOptions, setLeftOptions] = useState<any>(defaultOption)
    const [middleOptions, setMiddleOptions] = useState<any>(defaultOption)
    const [rightOptions, setRightOptions] = useState<any>(defaultOption)

    function genChartDatas(chartHeight, title, macdValue, trueData, 
        maData5, ma5Color, maData10, ma10Color, maData20, ma20Color, 
        maData120, ma120Color,maData250, ma250Color,chartDataUp, chartDataDown,
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
                max: macdValue/100.0,
                min: -macdValue/100.0,
    
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
                name: '移动平均线-MA120',
                data: maData120,
                tooltip: {
                    valueDecimals: 2
                },
                color: ma120Color
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
    const handleVoiceClick = () => {
        if(openVoice == false) {
            //开启声音，进行一次声音测试
            sound.play()
            alert('声音测试，如果听不到声音，请检查是否静音')
        }
        setOpenVoice(!openVoice)
    };
    const handleModeChange = (e) => {
        setViewMode(e.target.value)
        if(e.target.value == 'one') {
            let size = isMobile ? 24 : 20;
            setSpanSize(size)
        } else if (e.target.value == 'two') {
            setSpanSize(10)
        } else if (e.target.value == 'three') {
            setSpanSize(8)
        }
    };
    const sound = new Howl({
        src: ['/tips.wav']
    });
    const weakSound = new Howl({
        src: ['/weaktips.wav']
    })
    
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
    
    function getNextTime(curTime, period) {
        // 将 curTime 字符串转换为 Date 对象
        const year = parseInt(curTime.slice(0, 4));
        const month = parseInt(curTime.slice(4, 6)) - 1; // 月份从 0 开始计数
        const day = parseInt(curTime.slice(6, 8));
        const hour = parseInt(curTime.slice(8, 10));
        const minute = parseInt(curTime.slice(10, 12));
        const second = parseInt(curTime.slice(12, 14));
    
        const date = new Date(year, month, day, hour, minute, second);
    
        // 根据 period 增加相应的分钟数
        let minutesToAdd;
        switch (period) {
            case '1Min':
                minutesToAdd = 1;
                break;
            case '5Min':
                minutesToAdd = 5;
                break;
            case '30Min':
                minutesToAdd = 30;
                break;
            case '1Day':
                minutesToAdd = 24 * 60
                break;
            default:
                throw new Error('Invalid period');
        }
    
        date.setMinutes(date.getMinutes() + minutesToAdd);
    
        // 将 Date 对象转换为所需的字符串格式
        const nextYear = date.getFullYear();
        const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
        const nextDay = String(date.getDate()).padStart(2, '0');
        const nextHour = String(date.getHours()).padStart(2, '0');
        const nextMinute = String(date.getMinutes()).padStart(2, '0');
        const nextSecond = String(date.getSeconds()).padStart(2, '0');
    
        return `${nextYear}${nextMonth}${nextDay}${nextHour}${nextMinute}${nextSecond}`;
    };
    return  <div className={styles.content}>
       <div className={isMobile? styles.searchContentMobile : styles.searchContent}>
            {
                isMobile ? <>
                    <Input.Search className={styles.searchInput} placeholder="输入代码" defaultValue={code} onSearch={handleCodeChange}></Input.Search>
                    <div className={styles.searchContentMobile}>
                        <Dropdown.Button menu={leftMenuProps} onClick={handleLeftMenuClick} className={styles.searchMenu}>
                            {leftPeriodName}
                        </Dropdown.Button>
                        <Dropdown.Button menu={leftRangeMenuProps} onClick={handleLeftRangeMenuClick} className={styles.rangeMenu}>
                            {leftRangeName}
                        </Dropdown.Button>
                    </div>
                </>:<>
                    <Typography.Text className={styles.searchLabel}>股票代码</Typography.Text>
                    <Input.Search className={styles.searchInput} placeholder="输入代码" defaultValue={code} onSearch={handleCodeChange}></Input.Search>
                    <Button type="text" onClick={handleMACDClick} style={macdStyle}>MA</Button>
                    <Button type="text" onClick={handleLabelClick} style={labelStyle}>标签</Button>
                    <Button type="text" onClick={handleBiClick} style={biStyle}>笔</Button>
                    <Button type="text" onClick={handleCenterClick} style={centerStyle}>中枢</Button>
                    <Button type="text" onClick={handleBuySellClick} style={buysellStyle}>买卖点</Button>
                    {/* <Button type="text" onClick={handleRefreshClick} style={{color: "#1E90FF", width:30, marginLeft: 12}}>刷新</Button> */}
                    <Button type="text" onClick={handleRefreshTimerClick} style={{color: refreshColor,marginLeft: 12, width: 50, marginRight: 20}}>{updaterTimerFlag ? "停止刷新": "定时刷新"}</Button>
                    <Radio.Group value={viewMode} onChange={handleModeChange}>
                        <Radio value="one">单屏</Radio>
                        <Radio value="two">双屏</Radio>
                        <Radio value="three">三屏</Radio>
                    </Radio.Group>
                    <Typography.Text style={{marginLeft: 20, color: tipsColor}}>{tipsText}</Typography.Text>
                    <Button type="text" onClick={handleVoiceClick} style={{marginLeft: 12, color: '#FF0000', marginRight: 12}}>{openVoice ? '关提示音':'开提示音'}</Button>
                    
                    {/* <Button type="text" onClick={handleVoiceClick} style={buysellStyle}>测声音</Button> */}
                </>
            }
            

        </div> 
        <div>
            {
                isMobile ? <>
                    <Typography.Text style={{marginLeft: 12, color: dayPrice.color}}>现价 {dayPrice.price}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: dayPrice.color}}>涨幅 {dayPrice.rate}</Typography.Text> 
                    <Button type="text" onClick={handleMACDClick} style={macdStyle}>MA</Button>
                    <Button type="text" onClick={handleRefreshTimerClick} style={{color: refreshColor,marginLeft: 12, width: 50, marginRight: 12}}>{updaterTimerFlag ? "停止刷新": "定时刷新"}</Button>
                    <Button type="text" onClick={handleVoiceClick} style={{ color: '#FF0000'}}>{openVoice ? '关提示音':'开提示音'}</Button>
                    <div>
                        <Typography.Text style={{marginLeft: 20, color: tipsColor}}>{tipsText}</Typography.Text>
                        
                    </div>
                </>:
                <>
                    <Typography.Text style={{marginLeft: 12, color: dayPrice.color}}>现价 {dayPrice.price}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: dayPrice.color}}>涨幅 {dayPrice.rate}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: capitalColor[0]}}>昨日净流入：{capital.todayStr}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: capitalColor[1]}}>3日净流入：{capital.threeDayStr}</Typography.Text>
                    <Typography.Text style={{marginLeft: 12, color: capitalColor[2]}}>5日净流入：{capital.fiveDayStr}</Typography.Text>
                </>
            }
        </div>
        <Row className={styles.row} justify='center'>
            <Col span={spanSize} className={viewMode == 'one' ? styles.colNoborder : styles.col}>
                {
                    isMobile ? <></>:
                    <>
                        <div className={styles.searchContent}>
                            <Dropdown.Button menu={leftMenuProps} onClick={handleLeftMenuClick} className={styles.searchMenu}>
                                {leftPeriodName}
                            </Dropdown.Button>
                            <RangePicker showTime onChange={handleLeftTimeChange} value={leftDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 8}}></RangePicker>
                            <Dropdown.Button menu={leftRangeMenuProps} onClick={handleLeftRangeMenuClick} className={styles.rangeMenu}>
                                {leftRangeName}
                            </Dropdown.Button>
                            <InputNumber defaultValue={leftMacdValue} min={0} max={5000} onChange={LeftMACDValueChange} style={{marginLeft: 0, width: 100}}></InputNumber>
                        </div>
                    </>
                }
                {
                    isMobile && !macdEnable ? <></>:
                    <>
                    <div className={isMobile ? styles.maValueMobile : styles.maValue}>
                        <Typography.Text style={{marginLeft: 12, color: ma5Color, fontSize: maFontSize}}>MA5 {leftMa5Value}</Typography.Text>
                        <Typography.Text style={{marginLeft: 12, color: ma10Color, fontSize: maFontSize}}>MA10 {leftMa10Value}</Typography.Text>
                        <Typography.Text style={{marginLeft: 12, color: ma20Color, fontSize: maFontSize}}>MA20 {leftMa20Value}</Typography.Text>
                        <Typography.Text style={{marginLeft: 12, color: ma120Color, fontSize: maFontSize}}>MA120 {leftMa120Value}</Typography.Text>
                        <Typography.Text style={{marginLeft: 12, color: ma250Color, fontSize: maFontSize}}>MA250 {leftMa250Value}</Typography.Text>
                    </div>
                    </>
                } 
                
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={'stockChart'}
                    options={leftOptions}
                />
                
            </Col>
            {
                viewMode == 'three' || viewMode == 'two' ? <>
                    <Col span={spanSize} className={viewMode == 'two'? styles.colNoborder : styles.col}>
                        <div className={styles.searchContent}>
                            <Dropdown.Button menu={middleMenuProps} onClick={handleMiddleMenuClick} className={styles.searchMenu}>
                                {middlePeriodName}
                            </Dropdown.Button>
                            <RangePicker showTime onChange={handleMiddleTimeChange} value={middleDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 8}}></RangePicker>
                            <Dropdown.Button menu={middleRangeMenuProps} onClick={handleMiddleRangeMenuClick} className={styles.rangeMenu}>
                                {middleRangeName}
                            </Dropdown.Button>
                            <InputNumber defaultValue={middleMacdValue} min={0} max={5000} onChange={MiddleMACDValueChange} style={{marginLeft: 0, width: 100}}></InputNumber>

                        </div> 
                        <div className={styles.maValue}>
                            <Typography.Text style={{marginLeft: 12, color: ma5Color}}>MA5 {middleMa5Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma10Color}}>MA10 {middleMa10Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma20Color}}>MA20 {middleMa20Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma120Color}}>MA120 {middleMa120Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma250Color}}>MA250 {middleMa250Value}</Typography.Text>
                        </div>
                        <HighchartsReact
                            highcharts={Highcharts}
                            constructorType={'stockChart'}
                            options={middleOptions}
                        />
                    </Col>
                </>:<></>
            }
            {
                viewMode == 'three' ? <>
                    <Col span={spanSize} className={styles.colNoborder}>
                        <div className={styles.searchContent}>
                            <Dropdown.Button menu={rightMenuProps} onClick={handleRightMenuClick} className={styles.searchMenu}>
                                {rightPeriodName}
                            </Dropdown.Button>
                            <RangePicker showTime onChange={handleRightTimeChange} value={rightDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 4, marginLeft:4}}></RangePicker>
                            <Dropdown.Button menu={rightRangeMenuProps} onClick={handleRightRangeMenuClick} className={styles.rangeMenu}>
                                {rightRangeName}
                            </Dropdown.Button>
                            <InputNumber defaultValue={rightMacdValue} min={0} max={5000} onChange={RightMACDValueChange} style={{marginLeft: 0, width: 80}}></InputNumber>
                        </div> 
                        <div className={styles.maValue}>
                            <Typography.Text style={{marginLeft: 12, color: ma5Color}}>MA5 {rightMa5Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma10Color}}>MA10 {rightMa10Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma20Color}}>MA20 {rightMa20Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma120Color}}>MA120 {rightMa120Value}</Typography.Text>
                            <Typography.Text style={{marginLeft: 12, color: ma250Color}}>MA250 {rightMa250Value}</Typography.Text>
                        </div>
                        <HighchartsReact
                            highcharts={Highcharts}
                            constructorType={'stockChart'}
                            options={rightOptions}
                        />
                    </Col>
                </>:<></>
            }
            
        </Row>

    </div>
}

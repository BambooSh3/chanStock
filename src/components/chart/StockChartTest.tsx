import React, { useEffect, useState } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts, { charts, dateFormat, numberFormat } from 'highcharts/highstock';
import styles from "./StockChart.module.css"
import { BuySellItem, BuySellV2, capitalInfoUrl, CapitalItem, ChanCenterItem, ChanPointItem, dailyPriceUrl, DayPriceItem, genBiPointList, genBuySellPointV2, genCenterList, genMACDData, KItem, MAItem, parseCapital, parseDailyPrice } from "../../redux/kprice/slice";
import moment from "moment";
import { Input, Typography, Button, Dropdown, MenuProps, DatePicker, InputNumber } from "antd";
import { useSelector } from "../../redux/hooks";
import { useDispatch } from "react-redux";
import { changePeriodActionCreator, changeCodeActionCreator, changeTimeActionCreator, changeBiActionCreator,
     changeCenterActionCreator, changeLabelActionCreator, changeMACDActionCreator, macdChangeValueCreator,
      updatePriceCreator,updateTimerCreator, updateTimerFlagCreator, 
      changeLabelsCreator} from "../../redux/period/PeriodChangeAction"
import dayjs, { Dayjs } from "dayjs";
import HighchartsMore from 'highcharts/highcharts-more';
import Annotations from 'highcharts/modules/annotations';
import { Item } from "rc-menu";
import axios from "axios";

// 加载模块
HighchartsMore(Highcharts);
Annotations(Highcharts);


const { RangePicker } = DatePicker;



interface Props {
    title: string;
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
    buySellPoints: BuySellV2[];
    type: "daily" | "min";
    enableTimer: boolean;
    labels: any[];
}

function dateToUTCNumber(date: Date): number {
    const timezoneOffset = date.getTimezoneOffset(); // 获取时区偏移，单位为分钟
    const timezoneOffsetMs = timezoneOffset * 60 * 1000; // 转换为毫秒
    const localTime = date.getTime(); // 获取本地时间
    const utcTime = localTime - timezoneOffsetMs; // 计算UTC时间
    return utcTime;
}


function parseDailyData(data: KItem[]) {
    let chartData: number[][] = [];
    for (let item of data) {
        // console.log("haojin item:", item["date"]);
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["open"], item["high"], item["low"], item["close"]];
        // console.log("haojin test: ",chartItem);
        chartData.push(chartItem);
    }
    return chartData;
}

function parseMinData(data: KItem[]) {
    let chartData: number[][] = [];
    for (let item of data) {
        // console.log("haojin item:", item["date"]);
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["open"], item["high"], item["low"], item["close"]];
        // console.log("haojin test: ",chartItem);
        chartData.push(chartItem);
    }
    return chartData;
}


function parseData(data: KItem[], type: "daily" | "min") {
    if (type == "daily") {
        return parseDailyData(data);
    } else {
        return parseMinData(data);
    }
}
function parseMaData(data: MAItem[]) {
    let chartData: number[][] = [];
    for (let item of data) {
        // console.log("haojin item:", item["date"]);
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["close"]];
        // console.log("haojin test: ",chartItem);
        chartData.push(chartItem);
    }
    return chartData;
}
function parseVolData(data: KItem[]) {
    let chartDataUp: number[][] = [];
    let chartDataDown: number[][] = [];
    for (let item of data) {
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["vol"]];
        if (item["range"] > 0) {
            chartDataUp.push(chartItem);
        } else {
            chartDataDown.push(chartItem);
        }
    }

    return { chartDataUp, chartDataDown };
}

function parseMACD(macd, macdDif, macdDEA) {
    let chartMACD_RED: number[][] = [];
    let chartMACD_GREEN: number[][] = [];
    let chartDIF: number[][] = [];
    let chartDEA: number[][] = [];
    let max = 0;
    let min = 0;
    for (let item of macd) {
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["close"]];
        if (item["close"] > max) {
            max = item["close"];
        }
        if (item["close"] < min) {
            min = item["close"];
        }
        if (item["close"] >= 0) {
            chartMACD_RED.push(chartItem);
        } else {
            chartMACD_GREEN.push(chartItem);
        }
    }
    for (let item of macdDif) {
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["close"]];
        if (item["close"] > max) {
            max = item["close"];
        }
        if (item["close"] < min) {
            min = item["close"];
        }
        chartDIF.push(chartItem);
    }
    for (let item of macdDEA) {
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["close"]];
        if (item["close"] > max) {
            max = item["close"];
        }
        if (item["close"] < min) {
            min = item["close"];
        }
        chartDEA.push(chartItem);
    }
    return { chartMACD_RED: chartMACD_RED, chartMACD_GREEN: chartMACD_GREEN, chartDIF: chartDIF, chartDEA: chartDEA, max: max, min: min }
}
function parseChanBi(data: ChanPointItem[]) {
    let chartBi: number[][] = [];
    
    for (let item of data) {
        let date = moment(item["date"]).toDate();
        let chartItem = [dateToUTCNumber(date), item["point"]];
        chartBi.push(chartItem)
    }
    // console.log("bi: ", chartBi.length)
    return chartBi;
}
function parseBuySellPointLabelV2(data: BuySellV2[]) {
    let labels: any[] = []
    for (let i=0;i<data.length;i++) {
        let date = moment(data[i]["date"]).toDate();
        let color = data[i]["type"].startsWith('buy') ? "#FF0000" : "#006400"
        let text = data[i]["type"]
        let offsetY = data[i]["type"].startsWith('buy') ? 25 : -10; 
        let label = {
            point: {
                x: dateToUTCNumber(date),
                y: data[i]["price"],
                xAxis: 0,
                yAxis: 0
            },
            text: text,
            backgroundColor: 'rgba(255, 255, 255, 0)',
            borderColor: color,
            borderWidth: 1,
            style: {
                fontSize: '8px',
                fontColor: color
            },
            y: offsetY
        }
        labels.push(label)
    }
    return labels 
}
function parseBuySellPointLabel(data: BuySellItem[]) {
    let labels: any[] = []
    for (let i=0;i<data.length;i++) {
        let date = moment(data[i]["date"]).toDate();
        let color = data[i]["type"] === "buy" ? "#FF0000" : "#006400"
        let label = {
            point: {
                x: dateToUTCNumber(date),
                y: data[i]["price"],
                xAxis: 0,
                yAxis: 0
            },
            text: data[i]["type"],
            backgroundColor: '#FFFFFF',
            borderColor: color,
            borderWidth: 1,
            style: {
                fontSize: '12px',
                fontColor: color
            }
        }
        labels.push(label)
    }
    return labels 
}
function parseChanBiLabel(data: ChanPointItem[]) {
    let labels: any[] = []
    for (let i=0;i<data.length;i++) {
     
        let date = moment(data[i]["date"]).toDate();
        let label = {
            point: {
                x: dateToUTCNumber(date),
                y: data[i]["point"],
                xAxis: 0,
                yAxis: 0
            },
            text: data[i]["point"],
            backgroundColor: '#FFFFFF',
            borderColor: '#FF0000',
            borderWidth: 1,
            style: {
                fontSize: '12px',
                fontColor: '#FF0000'
            }
        }
        labels.push(label)
    }
    // console.log('test: ',labels)
    return labels
}
function parseMarkLine(enable) {
    let xAxisDic = {type: 'datetime'}
    let plotLines:any[] = []
    if (!enable) {
        xAxisDic['plotLines'] = plotLines
        return xAxisDic
    }
    const daystr = getCurrentDateFormatted(0,2) 
    const morning = daystr + " 09:00:00"
    const afternoon = daystr + " 13:00:00"
    let utcMorning = dateToUTCNumber(moment(morning).toDate())
    let utcAfternoon = dateToUTCNumber(moment(afternoon).toDate())
    let utcArray = [utcMorning]
    
    for (let utcValue of utcArray){
        let itemDic = {
            color: 'red',
            width: 1,
            value: utcValue,
            label: {
                text: '当天',
                align: 'right',
                style: {
                    color: 'red'
                }
            }
        }
        plotLines.push(itemDic)
    }
    xAxisDic['plotLines'] = plotLines
    return xAxisDic
}
function parseChanCenter(data: ChanCenterItem[]) {
    // console.log("chan center: ", data)
    let shapes: any[] = [];
    for(let item of data) {
        let leftDate = moment(item["leftDate"]).toDate();
        let rightDate = moment(item["rightDate"]).toDate();
        let points = [{
            x: dateToUTCNumber(leftDate),
            y: item["top"],
            xAxis: 0,
            yAxis: 0,
        },{
            x: dateToUTCNumber(rightDate),
            y: item["top"],
            xAxis: 0,
            yAxis: 0,
        },{
            x: dateToUTCNumber(rightDate),
            y: item["bottom"],
            xAxis: 0,
            yAxis: 0,
        },{
            x: dateToUTCNumber(leftDate),
            y: item["bottom"],
            xAxis: 0,
            yAxis: 0,
        },{
            x: dateToUTCNumber(leftDate),
            y: item["top"],
            xAxis: 0,
            yAxis: 0,
        }]
        let shape = {
            type: 'path',
            points: points,
            fill: 'rgb(255,0,0,0)',
            stroke: 'red',
            strokeWidth: 2
        }
        shapes.push(shape)
    }
    return shapes;
}
const rangeList = [
    { name: "一天", key: "Day_1" },
    { name: "一天半", key: "Day_1_half"},
    { name: "二天", key: "Day_2"},
    { name: "三天", key: "Day_3" },
    { name: "七天", key: "Day_7"},
    { name: "一个月", key: "Month_1" },
    { name: "三个月", key: "Month_3" },
    { name: "六个月", key: "Month_6" },
    { name: "一年", key: "Year_1" },
];
const periodList = [
    { name: "周线", period: "w" },
    { name: "日线", period: "d" },
    { name: "1分钟线", period: "1min" },
    { name: "5分钟线", period: "5min" },
    { name: "15分钟线", period: "15min" },
    { name: "30分钟线", period: "30min" },
    { name: "60分钟线", period: "60min" },
];

function getPeriodName(period: string) {
    let name = "30分钟线"
    for(const item of periodList){
        if(item.period == period) {
            name = item.name
            break
        }
    }
    return name
}
function genPeriodUrlKey(period: string) {
    if (period == 'w') {
        return 'weekly'
    } else if (period == 'd') {
        return 'daily'
    } else if (period == '1min') {
        return '1'
    } else if (period == '5min') {
        return '5'
    } else if (period == '15min') {
        return '15'
    } else if (period == '30min') {
        return '30'
    } else if (period == '60min') {
        return '60'
    }
    return ""
}

function findRangeName(key) {
    let name = "选择日期"
    for(const item of rangeList) {
        if(item.key == key) {
            name = item.name;
            break
        }
    }
    return name
}

function getCurrentDateFormatted(before, style): string {
    const now = new Date();
    while (isWeekend(now)) {
        now.setDate(now.getDate() - 1);
    }
    now.setDate(now.getDate() - before);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始计数，需加1，且保证两位数格式
    const day = String(now.getDate()).padStart(2, '0');
    if (style == 0) {
        return `${year}${month}${day}`;
    } else {
        return `${year}-${month}-${day}`;
    }
}

// 判断给定日期是否是周末（周六或周日）
function isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0表示周日，6表示周六
}

export const StockChartTest: React.FC<Props> = (props) => {
    const biEnable = useSelector((state) => state.periodChange.biEnable);
    const centerEnable = useSelector((state) => state.periodChange.centerEnable);
    const labelEnable = useSelector((state) => state.periodChange.labelEnable);
    const macdEnable = useSelector((state) => state.periodChange.macdEnable);
    // const macdValue = useSelector((state) => state.periodChange.macdValue);
    const updaterValue = useSelector((state) => state.periodChange.updater);
    const updaterTimer = useSelector((state) => state.periodChange.updaterTimer);
    const updaterTimerFlag = useSelector((state) => state.periodChange.updaterFlag);
    const startTime = useSelector((state) => state.periodChange.startTime);
    const endTime = useSelector((state) => state.periodChange.endTime);
    const period = useSelector((state) => state.periodChange.period);
    const code = useSelector((state) => state.periodChange.code);
    const isMobile = useSelector((state) => state.periodChange.isMobile); 
    const biStyle = biEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const centerStyle = centerEnable ? {color: "#FF6A6A"} : {color: "gray"};
    const labelStyle = labelEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const macdStyle = macdEnable ? {color:"#FF6A6A"} : {color:"gray"};
    const rangeStyle = {color:"#0000FF"};
    const trueData = parseData(props.data, props.type);
    const maData5 = macdEnable ? parseMaData(props.maData5) : [];
    const maData250 = macdEnable ? parseMaData(props.maData250) : [];
    const maData10 = macdEnable ? parseMaData(props.maData10) : [];
    const maData20 = macdEnable ? parseMaData(props.maData20) : [];
    const maData90 = macdEnable ? parseMaData(props.maData90) : [];
    const { chartDataUp, chartDataDown } = parseVolData(props.data);
    const { chartMACD_RED, chartMACD_GREEN, chartDIF, chartDEA, max, min } = parseMACD(props.macd, props.macdDif, props.macdDEA);
    const [macdValue, setMACDValue] = useState<number>(0)
    
    const chanBi = biEnable ? parseChanBi(props.chanBi) : [];
    const centerShapes =centerEnable ? parseChanCenter(props.chanCenter) : [];
    let labels =labelEnable ? parseChanBiLabel(props.chanBi) : [];
    let analyzeLabels = []
    const ma5Color = "#FAD700"
    const ma10Color = "#40E0CD"
    const ma20Color = "#0000FF"
    const ma90Color = "#A52A2A"
    const ma250Color = "#EE82EE"
    const maFontSize = isMobile? "10px" : "14px"
    const ma5Value = props.maData5.length > 0 ? props.maData5[props.maData5.length-1].close : "0";
    const ma10Value = props.maData10.length > 0 ? props.maData10[props.maData10.length-1].close : "0";
    const ma20Value = props.maData20.length > 0 ? props.maData20[props.maData20.length-1].close : "0";
    const ma90Value = props.maData90.length > 0 ? props.maData90[props.maData90.length-1].close : "0";
    const ma250Value = props.maData250.length > 0 ? props.maData250[props.maData250.length-1].close : "0";
    const curValue = props.data.length > 0 ? props.data[props.data.length-1].close : "0";
    const curRange = props.data.length > 0 ? props.data[props.data.length-1].range + '%' : "0%";
    const rangeColor = curRange[0] === '-' ? "#006400" : "#FF0000"
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs(startTime), dayjs(endTime)]);
    const leftHeight: number = window.innerHeight - 150;
    const chartStr = `${leftHeight}px`
    const [chartHeight, setChartHeight] = useState<string>(chartStr)
    
    const [price, setPrice] = useState<number>(0)
    const [priceRate, setPriceRate] = useState<number>(0)
    const [capital, setCapital] = useState<CapitalItem>({today: 0, threeDay: 0, fiveDay: 0, todayStr: '-', threeDayStr: '-', fiveDayStr: '-'})
    const [capitalColor, setCapitalColor] = useState<[string, string, string]>(['#FF0000','#FF0000','FF0000'])
    const [dayPrice, setDayPrice] = useState<DayPriceItem>({price: 0, rate: '0%', color: '#FF0000'})
    const [buySellEnable, setBuySellEnable] = useState<boolean>(true)
    const buysellStyle = buySellEnable ? {color:"#FF6A6A"} : {color:"gray"}; 
    const buySellItems = buySellEnable ? props.buySellPoints : [];
    const buyselllabels = buySellItems.length>0 ? parseBuySellPointLabelV2(buySellItems):[];
   
    const [analyze, setAnalyze] = useState<boolean>(false)
    const [step, setStep] = useState<number>(0)
    const [stepSize, setStepSize] = useState<number>(1)

   
    // useEffect(() => {
    //     setChartLabels(labels)
    //     console.log('haojin test set labels:', labels.length)
    // }, [labels.length]);
    useEffect(() => {
        let defaultMACDValue = Math.ceil(Math.max(Math.abs(max*100), Math.abs(min*100))/1.5)
        setMACDValue(defaultMACDValue)
    }, [max, min]) 
    useEffect(() => {
        fetchBaseInfo(code)
        fetchDailyInfo(code)
    }, [updaterTimer, updaterValue, 
        code]);
    
    const options = {
        chart: {
            height: chartHeight 

        },
        rangeSelector: {
            selected: 2
        },
        title: {
            text: props.title
        },
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
            labels:props.labels

        }]
    };
    useEffect(() => {
        setChartHeight(chartStr)
    }, []);
    const dispatch = useDispatch();
    const periodName = getPeriodName(period) 
    
    const dateFormat = 'YYYYMMDDHHmmss';
    const [rangeName, setRangeName] = useState<string>("一个月");

    const items = periodList.map((item) => {
        return { label: item.name, key: item.period };
    });
    const menuProps = {
        items,
        onClick: handleMenuClick,
    };
    

    const rangeItems = rangeList.map((item) => {
        return { label: item.name, key: item.key };
    });

    const rangeMenuProps = {
        items:rangeItems, 
        onClick: handleRangeMenuClick,
    };

    function handleMenuClick(e) {

        // console.log('search min:', e.key);

        dispatch(changePeriodActionCreator(e.key));
    }
    function handleRangeMenuClick(e) {
        const daystr = getCurrentDateFormatted(0,0)
        let startStr = daystr + "090000"
        let endStr = daystr + "200000"
        let name = findRangeName(e.key)
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
        setRangeName(name)
        // console.log('haojin test ', startStr, endStr)
        dispatch(changeTimeActionCreator([startStr, endStr]))
        setDateRange([dayjs(startStr), dayjs(endStr)])
    }

    const handleCodeChange = (keyword) => {
        if (keyword && (keyword.length === 6 || keyword.length === 5)) {
            // console.log("code is ", keyword);
            dispatch(changeCodeActionCreator(keyword))
        } else {
            console.log("invalid code")
        }
    };

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
   
    const handleTimeChange = (val) => {
        setDateRange(val)
        if (val && val.length == 2) {
            const startStr = val[0].format(dateFormat);
            const endStr = val[1].format(dateFormat);
            //  console.log("time change", startStr, endStr);
            dispatch(changeTimeActionCreator([startStr, endStr]))
        } else {
            console.log("invalid date", val);
        }
    };
    const handleLabelClick = () => {
        dispatch(changeLabelActionCreator(!labelEnable))
    };
    const handleBiClick = () => {
        dispatch(changeBiActionCreator(!biEnable))
    };
    const handleCenterClick = () => {
        dispatch(changeCenterActionCreator(!centerEnable))
    };
    const handleBuySellClick = () => {
        setBuySellEnable(!buySellEnable)
    }
    const handleRefreshClick = () => {
        dispatch(updatePriceCreator(updaterValue+1))
    };
    
    const handleRefreshTimerClick = () => {
        const flag = updaterTimerFlag;    
        dispatch(updateTimerFlagCreator(!flag));
        if(!flag) {
            startUpdating();
        } else {
            stopUpdating();
        }
    };
    function addUniqueItem(arr: BuySellV2[], newItem: BuySellV2): BuySellV2[] {
        const isDuplicate = arr.find(item => 
            item.type === newItem.type &&
            item.date === newItem.date &&
            item.index === newItem.index
        );
        if (!isDuplicate) {
            arr.push(newItem);
        }
        return arr;
    }
    const replayFunction = () => {
        let processArray:KItem[] = []
        let analyzePoints:BuySellV2[] = []
        for(let i=0; i < props.data.length && i <= step; i++) {
            processArray.push(props.data[i])
        }
        if(processArray.length == 0) {
            return
        }
        let {macd, dif, dea} = genMACDData(processArray)
        let chanBi = genBiPointList(processArray)
        let chanCenter = genCenterList(chanBi)
        let buySellPoints = genBuySellPointV2(chanBi, chanCenter, processArray, dif, dea, macd)
        labels = parseBuySellPointLabelV2(buySellPoints)
        let lastK = processArray[processArray.length - 1]
        let date = moment(lastK.date).toDate()
        let lastPoint = buySellPoints[buySellPoints.length - 1]
        if ((lastPoint != null && lastPoint != undefined && lastPoint.index != lastK.index) || lastPoint == undefined || lastPoint == null) {
            let testLabel = {
                point: {
                    x: dateToUTCNumber(date),
                    y: lastK.close,
                    xAxis: 0,
                    yAxis: 0
                },
                text: 'test',
                backgroundColor: 'rgba(255, 255, 255, 0)',
                borderColor: '#0000FF',
                borderWidth: 1,
                style: {
                    fontSize: '8px',
                    fontColor: '#0000FF'
                },
                y: 0
            }
            labels.push(testLabel)
        }
        dispatch(changeLabelsCreator(labels)) 
    }
    const handleReplyBackClick = () => {
        setStep(step - stepSize)
        replayFunction()
    };
    const handleReplyClick = () => {
        setStep(step + stepSize)
        replayFunction()
    };
    const handleStepSizeClick = (value: number | null) => {
        if (value != null) {
            setStepSize(value)
        }
        
    }
    
    const handleClearReply = () => {
        setStep(0)
        let {macd, dif, dea} = genMACDData(props.data)
        let chanBi = genBiPointList(props.data)
        let chanCenter = genCenterList(chanBi)
        let buySellPoints = genBuySellPointV2(chanBi, chanCenter, props.data, dif, dea, macd)
        labels = parseBuySellPointLabelV2(buySellPoints)
        dispatch(changeLabelsCreator(labels))
    }
    const handleAnalyzeClick = () => {
        // const startStr = val[0].format(dateFormat);
        // const endStr = val[1].format(dateFormat);
        if(analyze == true) {
            //正在分析，不重复分析
            return
        }
        setAnalyze(true)
        const startStr = dateRange[0].format(dateFormat);
        const endStr = dateRange[1].format(dateFormat);
        let processArray:KItem[] = []
        let analyzePoints:BuySellV2[] = []
        for(let i=0; i < props.data.length; i++) {
            processArray.push(props.data[i])
            let {macd, dif, dea} = genMACDData(processArray)
            let chanBi = genBiPointList(processArray)
            let chanCenter = genCenterList(chanBi)
            let buySellPoints = genBuySellPointV2(chanBi, chanCenter, processArray, dif, dea, macd)
            let point = buySellPoints[buySellPoints.length - 1]
            if(point != undefined && point != null) {
                if(analyzePoints.length == 0) {
                    analyzePoints.push(point)
                } else {
                    analyzePoints = addUniqueItem(analyzePoints, point)
                }
            }
        }
        // setChartLabels(analyzePoints)
        // labels = analyzePoints
        labels = parseBuySellPointLabelV2(analyzePoints) 
        console.log('haojin test buy sell cnt:', labels.length)
        dispatch(changeLabelsCreator(labels))
        setAnalyze(false)
    };
    
    const handleMACDClick = () => {
        dispatch(changeMACDActionCreator(!macdEnable))
    };
    const MACDValueChange = (value: number | null) => {
        if (value != null) {
            // dispatch(macdChangeValueCreator(value))
            setMACDValue(value)
        }
    };
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const startUpdating = () => {
        stopUpdating();
        if(!intervalId){
            const id = setInterval(() => {
                dispatch(updateTimerCreator())
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
    let refreshColor = updaterTimerFlag ? "#FF0000" : "#1E90FF";

    return (
        <div className={styles.content}>
            <div className={isMobile ? styles.searchContentMobile : styles.searchContent}>
                {
                    isMobile ? <></> : <Typography.Text className={styles.searchLabel}>股票代码</Typography.Text>
                }
                <Input.Search className={styles.searchInput} placeholder="输入代码" defaultValue={code} onSearch={handleCodeChange}></Input.Search>
                <Dropdown.Button menu={menuProps} onClick={handleMenuClick} className={isMobile ? styles.searchMenuMobile : styles.searchMenu}>
                    {periodName}
                </Dropdown.Button>
                {
                    isMobile ? <></> : <RangePicker showTime onChange={handleTimeChange} value={dateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 12}}></RangePicker>
                }
                <Dropdown.Button menu={rangeMenuProps} onClick={handleRangeMenuClick} className={isMobile? styles.rangeMenuMobile: styles.rangeMenu}>
                    {rangeName}
                </Dropdown.Button>

                {/* <Button type="text" onClick={handleRefreshClick} style={{color: "#1E90FF", width:30, marginLeft: 12}}>刷新</Button> */}
                <Button type="text" onClick={handleAnalyzeClick} style={{color: refreshColor,marginLeft: 12, width: 50}}>{analyze ? "正在分析": "分析"}</Button>
                <Button type="text" onClick={handleReplyClick} style={{color: refreshColor,marginLeft: 2, width: 50}}>重放+1</Button>
                <Button type="text" onClick={handleReplyBackClick} style={{color: refreshColor,marginLeft: 2, width: 50}}>重放-1</Button>
                <Button type="text" onClick={handleClearReply} style={{color: refreshColor,marginLeft: 2, width: 50}}>取消重放</Button>
                <InputNumber defaultValue={stepSize} min={0} max={100} onChange={handleStepSizeClick} style={{marginLeft: 8, width: 100}}></InputNumber>
                
            </div>
            
            <HighchartsReact
                highcharts={Highcharts}
                constructorType={'stockChart'}
                options={options}
            />

        </div>

    );
};
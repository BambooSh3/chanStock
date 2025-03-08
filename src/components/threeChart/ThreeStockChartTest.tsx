
import { Button, Col, DatePicker, Dropdown, InputNumber, Row } from "antd"
import Input from "antd/es/input"
import HighchartsReact from "highcharts-react-official";
import Highcharts, { dateFormat, numberFormat, setOptions } from 'highcharts/highstock';
import Typography from "antd/es/typography"
import React, { useEffect, useRef, useState } from "react"
import { findRangeName, genPeriodUrlKey, getCurrentDateFormatted,
     getPeriodName, parseBuySellPointLabelV2, parseChanBi, parseChanBiLabel, parseChanCenter,
      parseData, parseMACD, parseMarkLine, parseBuySellLines,parseVolData, periodList, rangeList, 
      removeBrackets} from "../chart/StockChart"
import styles from "./ThreeStockChart.module.css"
import { useSelector } from "../../redux/hooks";
import dayjs, { Dayjs } from "dayjs"
import { BuySellV2, codeMap,  genBiPointList,  genBuySellPointV2, genCenterList, genKPriceUrl, genMACDData,  hkCodeMap, KItem, 
     parseDailyData, parseMinData, showTips } from "../../redux/kprice/slice"
import axios from "axios"
import { debounce } from 'lodash'
import HighchartsMore from 'highcharts/highcharts-more';
import Annotations from 'highcharts/modules/annotations';
// 加载模块
HighchartsMore(Highcharts);
Annotations(Highcharts);

const { RangePicker } = DatePicker;

export const ThreeStockChartTest: React.FC = () => {
    const [code, setCode] = useState<string>("000688") 
    const codeDic = useSelector((state) => state.periodChange.codeNameDic);
    const [buySellEnable, setBuySellEnable] = useState<boolean>(true)
    const [labelEnable, setLabelEnable] = useState<boolean>(false)
    const [markEnable, setMarkEnable] = useState<boolean>(false)
    const [macdEnable,setMacdEnable] = useState<boolean>(false)
    const markStyle = markEnable ? {color:"#FF6A6A"} : {color:"gray"}; 
    let refreshColor =  "#1E90FF";
    const [leftRangeName, setLeftRangeName] = useState<string>("一个月");
    const [middleRangeName, setMiddleRangeName] = useState<string>("一个月");
    const [buySellName, setBuySellName] = useState<string>("none");
    //按一个月算
    const daystr = getCurrentDateFormatted(0,0)
    const monthstr = getCurrentDateFormatted(30,0)
    let leftStartStr = monthstr + "090000"
    let leftEndStr = daystr + "200000"
    
    const [leftDateRange, setLeftDateRange] = useState<[Dayjs, Dayjs]>([dayjs(leftStartStr),dayjs(leftEndStr)]);
    const [middleDateRange, setMiddleDateRange] = useState<[Dayjs, Dayjs]>([dayjs(leftStartStr),dayjs(leftEndStr)]);
    const [leftStartTime,setLeftStartTime] = useState<string>(leftStartStr)
    const [middleStartTime,setMiddleStartTime] = useState<string>(leftStartStr)
    const [leftEndTime,setLeftEndTime] = useState<string>(leftEndStr)
    const [middleEndTime,setMiddleEndTime] = useState<string>(leftEndStr)
    const dateFormat = 'YYYYMMDDHHmmss';
    const [leftPeriod, setLeftPeriod] = useState<string>("30")
    const [middlePeriod, setMiddlePeriod] = useState<string>("5")
    const [leftPeriodName, setLeftPeriodName] = useState<string>("30分钟线")
    const [middlePeriodName, setMiddlePeriodName] = useState<string>("5分钟线")
   
    const [leftKDatas, setLeftKDatas] = useState<KItem[]>([])
    const [middleKDatas, setMiddleKDatas] = useState<KItem[]>([])
    const leftHeight: number =  window.innerHeight - 230; 
    const chartStr = `${leftHeight}px`
    const [chartHeight, setChartHeight] = useState<string>(chartStr)
    const [markArray, setMarkArray] = useState<string[]>([])
    const [buySellMenu, setBuySellMenu] = useState<{label:string, key: string}[]>([])

    useEffect(() => {
        setChartHeight(chartStr)
    }, []);
    const fetchAllData = () => {
        fetchKPrice(code, "left")
        fetchKPrice(code, "middle")
    }
    const fetchAllWithDebounce = debounce(fetchAllData, 200)
    
    const checkTips = (leftDatas: BuySellV2[], middleDatas: BuySellV2[], needCheck: boolean) => {
        if(leftDatas.length < 1 || middleDatas.length < 1) return;
        let leftItem = leftDatas[leftDatas.length - 1]
        if(needCheck) {
            if(showTips(leftItem, leftPeriod,middleDatas)) {
                let buyType = ""
                if(leftItem.type.startsWith('buy')) {
                    buyType = "buy"
                } else {
                    buyType = "sell"
                }
                let text = "买卖建议：" + leftPeriodName + leftItem.date + ':' + buyType + ':' + leftItem.price
                let markItem = leftItem.date + '[' + buyType + `${markArray.length + 1}` + ']'
                if(!markArray.includes(markItem)){
                    markArray.push(markItem)
                }
                // setTipsText(text)
                console.log(text)
            }
        } 
    }
    useEffect(() => {
        fetchAllWithDebounce()
        console.log('fetch all with debounce')
        // checkTips()
    }, [  
        code, macdEnable,  
        labelEnable, markEnable, buySellEnable ]);


    const fetchLeftData = () => {
        fetchKPrice(code, "left")
    }
    const fetchLeftWithDebounce = debounce(fetchLeftData, 200) 
    useEffect(() => {
        fetchLeftWithDebounce()
    }, [leftStartTime, leftEndTime, leftPeriod ]); 

    const fetchMiddleData = () => {
        fetchKPrice(code, "middle")
    }
    const fetchMiddleWithDebounce = debounce(fetchMiddleData, 200) 

    useEffect(() => {
       fetchMiddleWithDebounce() 
    }, [middleStartTime, middleEndTime, middlePeriod]); 

    function applyChart(priceList: KItem[],
         period: string, 
         mode: "left" | "right" | "middle",
          test: boolean):[BuySellV2[], boolean] {
        const macd_dic = genMACDData(priceList);
        
        let macdValue = 0 
        const macd_dif = macd_dic.dif
        const macd_dea = macd_dic.dea
        const macd = macd_dic.macd
        const bi = genBiPointList(priceList);
        const center = genCenterList(bi) ;
        const buySellItems = buySellEnable ? genBuySellPointV2(bi, center, priceList, macd_dif, macd_dea, macd) : [];
        const type = (period == 'weekly' || period == 'daily') ? 'daily' : "min"
        const trueData = parseData(priceList, type);
        const { chartDataUp, chartDataDown } = parseVolData(priceList);
        const { chartMACD_RED, chartMACD_GREEN, chartDIF, chartDEA, max, min } = parseMACD(macd, macd_dif, macd_dea);
        let defaultMACDValue = Math.ceil(Math.max(Math.abs(max*100), Math.abs(min*100))/1.5)
        if (macdValue == 0) {
            macdValue = defaultMACDValue
        }
        const chanBi = parseChanBi(bi);
        const centerShapes = parseChanCenter(center);
        let points = buySellMenu.map((item) => {
            return item.key
        });
        const markValues = parseBuySellLines(markEnable, points);
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
        const codeName = codeDic[code] != null ? `${codeDic[code]}--${periodtitle}走势图` : `${code}--${periodtitle}走势图`
        document.title = codeDic[code] != null ? `${codeDic[code]}走势图` : `${code}走势图` 
        const options = genChartDatas(chartHeight,codeName,macdValue,
            trueData, 
            chartDataUp, chartDataDown, chartMACD_RED,
            chartMACD_GREEN,chartDIF,chartDEA,chanBi,centerShapes,labels,markValues)
        let needCheck = false
        if(buySellItems.length > 0 && priceList.length > 0) {
            if(buySellItems[buySellItems.length - 1].index + 3 >= priceList[priceList.length - 1].index) {
                needCheck = true
            }
        } 
        if(!test) {
            if (mode == "left") {
                setLeftOptions(options)
                setLeftKDatas(priceList)
            } else if (mode == "middle") {
                setMiddleOptions(options)
                setMiddleKDatas(priceList)
            } 
        }
        return [buySellItems, needCheck]
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
        const { data } = await axios.get(url);
        let priceList:KItem[] = []
        if (period == 'daily' || period == 'weekly') {
            priceList = parseDailyData(data);
        } else {
            priceList = parseMinData(data, code);
        }
        applyChart(priceList, period, mode, false)
    }
    
    const defaultOption = genChartDatas(chartHeight, "", 0, 
        [],
        [],[],[],[],[],[],[],[],[],parseMarkLine(false))
    const [leftOptions, setLeftOptions] = useState<any>(defaultOption)
    const [middleOptions, setMiddleOptions] = useState<any>(defaultOption)

    function genChartDatas(chartHeight, title, macdValue, trueData, 
        chartDataUp, chartDataDown,
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
    const buySellMenuProps = {
        items: buySellMenu, 
        onClick: handleBuySellMenuClick,
    };
    
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
    

    const handleCodeChange = (keyword) => {
        if (keyword && (keyword.length === 6 || keyword.length === 5)) {
            // console.log("code is ", keyword);
            setCode(keyword)
        } else {
            console.log("invalid code")
        }
    }
    

    const handleAutoReplay = () => {
        markArray.length = 0
        for(let i=0;i<=leftKDatas.length;i++){
            replayFunction(i, true)
        }
        let items = markArray.map((item) => {
            return { label: item, key: item };
        });
        setBuySellMenu(items)
        alert('处理完成')
    }

    function compareDates(dateStr1: string, dateStr2: string): boolean {
        const date1 = new Date(dateStr1);
        const date2 = new Date(dateStr2);
    
        // 检查日期字符串是否有效
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
            throw new Error('Invalid date string provided');
        }
    
        return date1.getTime() >= date2.getTime();
    }
    const replayFunction = (size: number, noChart: boolean) => {
        let processArray:KItem[] = []
        for(let i=0; i < leftKDatas.length && i <= size; i++) {
            processArray.push(leftKDatas[i])
        }
        let leftDatas = applyChart(processArray, leftPeriod, "left", noChart) 
        if(processArray.length > 0) {
            let lastDate = processArray[processArray.length - 1].date
            let middleArray: KItem[] = []
            let i = 0;
            while(i<middleKDatas.length && compareDates(lastDate, middleKDatas[i].date)) {
                middleArray.push(middleKDatas[i])
                i++;
            }
            let middleDatas = applyChart(middleArray, middlePeriod, "middle", noChart)
            checkTips(leftDatas[0], middleDatas[0], leftDatas[1])
        }
       
    }
    
    const handleMarkClick = () => {
        setMarkEnable(!markEnable)
    }
    
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

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
  
    
    function handleLeftMenuClick(e) {
        setLeftPeriod(genPeriodUrlKey(e.key))
        const name = getPeriodName(e.key)
        setLeftPeriodName(name)
    };
    
    function handleBuySellMenuClick(e) {
        let endStr = removeBrackets(e.key)
        setLeftEndTime(endStr)
        setLeftDateRange([dayjs(leftStartStr), dayjs(endStr)])
        setMiddleEndTime(endStr)
        setMiddleDateRange([dayjs(leftStartStr), dayjs(endStr)])
        setBuySellName(endStr)
        fetchKPrice(code, 'left')
        fetchKPrice(code, 'middle')
    }
    const handleClearReply = () => {
        markArray.length = 0
        setLeftEndTime(leftEndStr)
        setLeftDateRange([dayjs(leftStartStr), dayjs(leftEndStr)])
        setMiddleEndTime(leftEndStr)
        setMiddleDateRange([dayjs(leftStartStr), dayjs(leftEndStr)])
        fetchKPrice(code, "left")
        fetchKPrice(code, "middle")
    }
    
    function handleMiddleMenuClick(e) {
        setMiddlePeriod(genPeriodUrlKey(e.key))
        const name = getPeriodName(e.key)
        setMiddlePeriodName(name)
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
   
    return  <div className={styles.content}>
       <div className={styles.searchContent}>
            <Typography.Text className={styles.searchLabel}>股票代码</Typography.Text>
            <Input.Search className={styles.searchInput} placeholder="输入代码" defaultValue={code} onSearch={handleCodeChange}></Input.Search>
            <Button type="text" onClick={handleAutoReplay} style={{color: refreshColor,marginLeft: 15, width: 50}}>自动重放</Button>
            <Button type="text" onClick={handleClearReply} style={{color: refreshColor,marginLeft: 15, width: 50}}>取消重放</Button>
            <Button type="text" onClick={handleMarkClick} style={markStyle}>刻度</Button> 
            <Dropdown.Button menu={buySellMenuProps} onClick={handleBuySellMenuClick} className={styles.buySellMenu}>
                {buySellName}
            </Dropdown.Button> 
        </div> 
        
        <Row className={styles.row} justify='center'>
            <Col span={10} className={styles.col}>
                <div className={styles.searchContent}>
                    <Dropdown.Button menu={leftMenuProps} onClick={handleLeftMenuClick} className={styles.searchMenu}>
                        {leftPeriodName}
                    </Dropdown.Button>
                    <RangePicker showTime onChange={handleLeftTimeChange} value={leftDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 8}}></RangePicker>
                    <Dropdown.Button menu={leftRangeMenuProps} onClick={handleLeftRangeMenuClick} className={styles.rangeMenu}>
                        {leftRangeName}
                    </Dropdown.Button>
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={'stockChart'}
                    options={leftOptions}
                />
                
            </Col>
               
            <Col span={10} className={styles.colNoborder }>
                <div className={styles.searchContent}>
                    <Dropdown.Button menu={middleMenuProps} onClick={handleMiddleMenuClick} className={styles.searchMenu}>
                        {middlePeriodName}
                    </Dropdown.Button>
                    <RangePicker showTime onChange={handleMiddleTimeChange} value={middleDateRange} format={"YYYY-MM-DD HH:mm:ss"}style={{marginRight: 8}}></RangePicker>
                    <Dropdown.Button menu={middleRangeMenuProps} onClick={handleMiddleRangeMenuClick} className={styles.rangeMenu}>
                        {middleRangeName}
                    </Dropdown.Button>

                </div> 
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={'stockChart'}
                    options={middleOptions}
                />
            </Col>
        </Row>

    </div>
}

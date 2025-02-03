import React, { useEffect, useState } from "react";
import { Header } from "../../components";
import styles from "./FilterPage.module.css"
import { DatePicker, Dropdown, Typography, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";
import Papa from 'papaparse';
import axios from "axios";
import { ChanCenterItem, genBiPointList, genCenterList, genMACDData, genMAData, KItem, MAItem, parseMinData } from "../../redux/kprice/slice";
import { useAppDispatch, useSelector } from "../../redux/hooks";


const { RangePicker } = DatePicker;

export const FilterPage: React.FC = () => {
    const dateFormat = 'YYYYMMDDHHmmss';
    const [solutionName, setSolutionName] = useState<string>("选择策略");
    const [solutionType, setSolutionType] = useState<string>("30Min_1_buy")
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [rangeName, setRangeName] = useState<string>("选择日期");
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const codeNameDic = useSelector((state) => state.periodChange.codeNameDic);
    const [execInfo, setExecInfo] = useState<string>("");
    const solutionList = [
        { name: "30分钟1买", key: "30Min_1_buy" },
        { name: "30分钟3买", key: "30Min_3_buy" },
    ];
    const rangeList = [
        { name: "一天", key: "Day_1" },
        { name: "一天半", key: "Day_1_half" },
        { name: "二天", key: "Day_2" },
        { name: "三天", key: "Day_3" },
        { name: "七天", key: "Day_7" },
        { name: "一个月", key: "Month_1" },
        { name: "三个月", key: "Month_3" },
        { name: "六个月", key: "Month_6" },
        { name: "一年", key: "Year_1" },
    ];
    const rangeItems = rangeList.map((item) => {
        return { label: item.name, key: item.key };
    });

    const rangeMenuProps = {
        items: rangeItems,
        onClick: handleRangeMenuClick,
    };
    function findRangeName(key) {
        let name = "选择日期"
        for (const item of rangeList) {
            if (item.key == key) {
                name = item.name;
                break
            }
        }
        return name
    }
    function handleRangeMenuClick(e) {
        const daystr = getCurrentDateFormatted(0, 0)
        let startStr = daystr + "090000"
        let endStr = daystr + "200000"
        let name = findRangeName(e.key)
        if (e.key == "Day_1") {
            // nothing
        } else if (e.key == "Day_1_half") {
            const daystr = getCurrentDateFormatted(1, 0)
            startStr = daystr + "130000"
        } else if (e.key == "Day_2") {
            const daystr = getCurrentDateFormatted(2, 0)
            startStr = daystr + "090000"
        } else if (e.key == "Day_3") {
            const day3str = getCurrentDateFormatted(3, 0)
            startStr = day3str + "090000"
        } else if (e.key == "Month_1") {
            const monthstr = getCurrentDateFormatted(30, 0)
            startStr = monthstr + "090000"
        } else if (e.key == "Month_3") {
            const month3str = getCurrentDateFormatted(90, 0)
            startStr = month3str + "090000"
        } else if (e.key == "Month_6") {
            const month6str = getCurrentDateFormatted(180, 0)
            startStr = month6str + "090000"
        } else if (e.key == "Year_1") {
            const yearstr = getCurrentDateFormatted(365, 0)
            startStr = yearstr + "090000"
        }
        setRangeName(name)
        setDateRange([dayjs(startStr), dayjs(endStr)])
        setStartTime(startStr)
        setEndTime(endStr)
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

    const codeMap = ["000688"]
    function findSolutionName(key) {
        let name = "选择日期"
        for (const item of solutionList) {
            if (item.key == key) {
                name = item.name;
                break
            }
        }
        return name
    }
    const solutionItems = solutionList.map((item) => {
        return { label: item.name, key: item.key };
    });

    const solutionMenuProps = {
        items: solutionItems,
        onClick: handleSolutionMenuClick,
    };

    const handleTimeChange = (val) => {
        setDateRange(val)
        if (val && val.length == 2) {
            const startStr = val[0].format(dateFormat);
            const endStr = val[1].format(dateFormat);
            console.log("time change", startStr, endStr);
            setStartTime(startStr)
            setEndTime(endStr)
        } else {
            console.log("invalid date", val);
        }
    };

    function handleSolutionMenuClick(e) {
        const name = findSolutionName(e.key)
        setSolutionName(name)
        setSolutionType(e.key)
    }
    const result_array: {code: string, name: string}[] = []

    async function submitSolution() {
        //获取股票列表
        let info = 'start analyze ' + startTime + " " + endTime + " " + solutionType
        console.log('start analyze', startTime, endTime, solutionType)
        setExecInfo(info)

        const start = Date.now()
        setLoading(true)
        // const filePath= '/A500_A1000_Ke50_Ke100.csv'
        const filePath = 'temp.csv'
        const response = await fetch(filePath)
        const text = await response.text()
        const results = await Papa.parse(text, { header: true })
        const array: string[] = []
        results.data.forEach(element => {
            array.push(element.code)
        })
        for (let i = 0; i < array.length; i++) {
            if (i % 100 == 0) {
                console.log('cur index', i);
            }
            await filterCode(array[i]);
        }
        saveCSVFile()
        setLoading(false)
        const cost = Date.now() - start
        info = 'end analyze, cost: ' + cost/1000 + " s" + ", find stock: " + result_array.length 
        setExecInfo(info)
        console.log('end analyze, cost', cost/1000 ,'s,find stock: ', result_array.length)
    }
    function saveCSVFile() {
        //code_array转code_dic
        const csvData = Papa.unparse(result_array)
        //保存到本地
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf - 8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = solutionType + '.csv';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }
    async function filterCode(code) {
        let url = ""
        if (navigator.userAgent.indexOf('Windows') > -1) {
            url = "http://192.168.31.62:8000/min_stock_data";
            if (codeMap.includes(code)){
                url = "http://192.168.31.62:8000/min_etf_data"
            }
        } else {
            // 分钟k线
            url = "http://127.0.0.1:8080/api/public/stock_zh_a_hist_min_em";
            if (codeMap.includes(code)) {
                url = "http://127.0.0.1:8080/api/public/index_zh_a_hist_min_em"
            }
        }
        url = url + `?symbol=${code}&period=${30}&start_date=${startTime}&end_date=${endTime}`;
        const { data } = await axios.get(url);
        const priceList = parseMinData(data, code);
        const macd_dic = genMACDData(priceList)
        const macd_dif = macd_dic.dif
        const macd_dea = macd_dic.dea
        const bi = genBiPointList(priceList)
        const center = genCenterList(bi);
        if (solutionType == "30Min_1_buy") {
            if(one_buy(priceList, macd_dif, macd_dea, center)) {
                let name = ""
                if(codeNameDic[code]) {
                    name = codeNameDic[code]
                }
                result_array.push({code: code, name: name})
            }
        } else if (solutionType == "30Min_3_buy") {
            if(three_buy(priceList, macd_dif, macd_dea, center)) {
                let name = ""
                if(codeNameDic[code]) {
                    name = codeNameDic[code]
                }
                result_array.push({code: code, name: name})
            }
        }
    }

    function three_buy(priceList: KItem[], 
        macd_dif: MAItem[], 
        macd_dea: MAItem[], 
        centerList: ChanCenterItem[]): boolean {
        return false
    }
    
    function one_buy(priceList: KItem[], 
        macd_dif: MAItem[], 
        macd_dea: MAItem[], 
        centerList: ChanCenterItem[]): boolean {
        const flag = last_center(priceList, false, false, centerList)
        if (flag == false) {
            return false
        }
        if (macd_dif.length < 30) {
            return false
        }
        let index = macd_dif.length - 30
        let near_zero = false
        while (index < macd_dif.length) {
            const dif_value = macd_dif[index].close
            if (Math.abs(dif_value) <= 0.03) {
                near_zero = true
                break
            }
            index++
        }
        if (near_zero == false) {
            return false
        }
        //必须金叉
        if (macd_dif[macd_dif.length - 1].close < macd_dea[macd_dea.length - 1].close) {
            return false
        }
        return true
    }
    function last_center(priceList: KItem[], three_buy: boolean, need_ma: boolean, centerList: ChanCenterItem[]): boolean {
        if (need_ma) {
            if (ma_near(priceList, 5, 10) == false) {
                return false
            }
            if (ma_near(priceList, 10, 20) == false) {
                return false
            }
            if (ma_near(priceList, 5, 20) == false) {
                return false
            }
        }
        if (centerList.length < 2) {
            return false
        }
        let center1: null | ChanCenterItem = null
        if (centerList.length > 2) {
            center1 = centerList[centerList.length - 3]
        }
        const center2: ChanCenterItem = centerList[centerList.length - 2]
        const center3: ChanCenterItem = centerList[centerList.length - 1]
        const three_center_flag = center1 != null && center1.bottom > center2.top && center2.bottom > center3.top
        const price_20_percent = center2.top > priceList[priceList.length - 1].low && (center2.top - priceList[priceList.length - 1].low) / priceList[priceList.length - 1].low > 0.15
        //如果两个条件都不满足，舍弃
        if (three_center_flag == false && price_20_percent == false) {
            return false
        }

        if (three_buy == true) {
            const flag_price_up = priceList[priceList.length - 1].close > center3.top
            if (flag_price_up == false) {
                return false
            }
        } else {
            const flag_price_down = priceList[priceList.length - 1].close < center3.bottom
            if (flag_price_down == false) {
                return false
            }
        }
        return true
    }
    function ma_near(priceList: KItem[], ma1: number, ma2: number): boolean {
        if (priceList == null) {
            return false
        }
        if (priceList.length <= 0) {
            return false
        }
        const ma5_list: MAItem[] = genMAData(priceList, ma1)
        const ma10_list: MAItem[] = genMAData(priceList, ma2)
        let start_index = ma5_list.length - 15
        for (let num = start_index; num < ma5_list.length; num++) {
            const ma5 = ma5_list[num].close;
            let currentMax = ma5;
            let currentMin = ma5;
            const ma10 = ma10_list[num].close;
            currentMax = ma10 > currentMax ? ma10 : currentMax;
            currentMin = ma10 < currentMin ? ma10 : currentMin;
            if ((currentMax - currentMin) / currentMin > 0.02) {
                return false;
            }
        }
        return true
    }

    return <div>
        <Header type={"filter"}></Header>
        <div className={styles.content}>
            <RangePicker className={styles.datepacker} showTime onChange={handleTimeChange} value={dateRange} format={"YYYY-MM-DD HH:mm:ss"} style={{ marginRight: 12 }}></RangePicker>
            <Dropdown.Button menu={rangeMenuProps} onClick={handleRangeMenuClick} className={styles.rangeMenu}>
                {rangeName}
            </Dropdown.Button>
            <Dropdown.Button menu={solutionMenuProps} onClick={handleSolutionMenuClick} className={styles.solutionMenu}>
                {solutionName}
            </Dropdown.Button>
            <Button
                type="primary"
                loading={loading}
                onClick={submitSolution}
                iconPosition="end"
            >
                提交
            </Button>
            <Typography.Text style={{marginLeft: 12, color: "#FF0000"}}>{execInfo}</Typography.Text>

        </div>
    </div>
};
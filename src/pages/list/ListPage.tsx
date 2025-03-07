import React, { useEffect, useState } from "react";
import { Header, Footer, StockChart, getPeriodName } from "../../components";
import styles from "./ListPage.module.css"
import { useAppDispatch, useSelector } from "../../redux/hooks";
import { searchKPrice } from "../../redux/kprice/slice";
import {Row, Col } from "antd"
import { StockList } from "../../components/stocklist";
import Papa from 'papaparse';
import { changeCodeListActionCreator, loadCodeNameDicActionCreator } from "../../redux/period/PeriodChangeAction";


export const ListPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { data, maData5, maData10, maData20, maData120, maData250, macd, macdDif, macdDEA,
        chanBi, chanCenter, buySellPoints,loading, error } = useSelector((state) => state.kPrice);
    const period = useSelector((state) => state.periodChange.period);
    const periodName = getPeriodName(period) 
    const code = useSelector((state) => state.periodChange.code);
    const codeName = useSelector((state) => state.periodChange.codeName);
    const startTime = useSelector((state) => state.periodChange.startTime);
    const endTime = useSelector((state) => state.periodChange.endTime);
    const updaterValue = useSelector((state) => state.periodChange.updater);
    const updaterTimer = useSelector((state) => state.periodChange.updaterTimer);
    const codeNameDic = useSelector((state) => state.periodChange.codeNameDic);

    const searchType = (period == "d" || period == "w") ? "daily" : "min";
    let periodKey = "30";
    if (period == "d") {
        periodKey = "daily";
    } else if (period == 'w') {
        periodKey = 'weekly'
    } else if (period == "1min") {
        periodKey = "1";
    } else if (period == "5min") {
        periodKey = "5";
    } else if (period == "60min") {
        periodKey = "60";
    } else if (period == "15min") {
        periodKey = "15";
    }
    const title = codeName != null ? `${codeName}--${periodName}走势图` : `${code}--${periodName}走势图`

    useEffect(() => {
        const param = {
            "code": code,
            "period": periodKey,
            "start_date": startTime,
            "end_date": endTime,
        }
        console.log("haojin test triger: ", periodKey, code, startTime, endTime, updaterValue, updaterTimer)
        dispatch(searchKPrice(param))
    }, [periodKey, code, startTime, endTime, updaterValue, updaterTimer]);
    
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function () {
            const csvData = reader.result;
            // 使用papaparse解析文件内容
            Papa.parse(csvData, {
                header: true,
                complete: function(result) {
                    console.log(result)
                    const fileData = result.data.map((element, index)=>({
                        key: index + 1,
                        name: element.name,
                        code: element.code
                    }))
                    dispatch(changeCodeListActionCreator(fileData))
                }
            }) 
        };
        reader.readAsText(file);
    };
    return <div>
        <Header type='list'></Header>
        <Row>
            <Col span={4}>
                <div className={styles.left}>
                    <input type="file" onChange={handleFileSelect} className={styles.loadcsv} accept=".csv,text/csv"></input> 
                    <StockList></StockList>
                </div>
                
            </Col>
            <Col span={20}>
                <div className={styles.right}>
                    <StockChart title={title} data={data}
                    maData10={maData10} maData20={maData20} maData120={maData120}
                    maData5={maData5} maData250={maData250}
                    macd={macd} macdDEA={macdDEA} macdDif={macdDif}
                    chanBi={chanBi} chanCenter={chanCenter} buySellPoints={buySellPoints}
                    type={searchType} enableTimer={false}></StockChart>
                </div>
            </Col>
        </Row>
    </div>
};
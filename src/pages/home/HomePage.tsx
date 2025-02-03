import React, { useEffect, useState } from "react";
import { Header, Footer, StockChart, getPeriodName } from "../../components";
import styles from "./HomePage.module.css"
import { useAppDispatch, useSelector } from "../../redux/hooks";
import { searchKPrice } from "../../redux/kprice/slice";
import { debounce } from 'lodash'

export const HomePage: React.FC = () => {

    const dispatch = useAppDispatch();
    const { data, maData5, maData10, maData20, maData90, maData250, macd, macdDif, macdDEA,
        chanBi, chanCenter, loading, error } = useSelector((state) => state.kPrice);
    const period = useSelector((state) => state.periodChange.period);
    const periodName = getPeriodName(period)
    const code = useSelector((state) => state.periodChange.code);
    const codeNameDic = useSelector((state) => state.periodChange.codeNameDic);
    const codeName = useSelector((state) => state.periodChange.codeName);
    const startTime = useSelector((state) => state.periodChange.startTime);
    const endTime = useSelector((state) => state.periodChange.endTime);
    const updaterValue = useSelector((state) => state.periodChange.updater);
    const updaterTimer = useSelector((state) => state.periodChange.updaterTimer)
    
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
    document.title = title
    const fetchData = () => {
        const param = {
            "code": code,
            "period": periodKey,
            "start_date": startTime,
            "end_date": endTime,
        }
        console.log("haojin test triger: ", periodKey, code, startTime, endTime, updaterValue, updaterTimer)
        dispatch(searchKPrice(param))
    }
    const fetchWithDebounce = debounce(fetchData, 200)
    useEffect(() => {
        fetchWithDebounce()
    }, [periodKey, code, startTime, endTime, updaterValue, updaterTimer]);
   


    return <div>
        <Header type="home"></Header>
        <div className={styles.content}>
            <StockChart title={title} data={data}
                maData10={maData10} maData20={maData20} maData90={maData90}
                maData5={maData5} maData250={maData250}
                macd={macd} macdDEA={macdDEA} macdDif={macdDif}
                chanBi={chanBi} chanCenter={chanCenter}
                type={searchType} enableTimer={true}></StockChart>

        </div>
    </div>

};
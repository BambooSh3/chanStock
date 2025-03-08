import React, { useEffect, useState } from "react";
import { Header, Footer, StockChartTest, getPeriodName, ThreeStockChartTest } from "../../components";
import styles from "./TestPage.module.css"
import { useAppDispatch, useSelector } from "../../redux/hooks";
import { searchKPrice } from "../../redux/kprice/slice";
import { debounce } from 'lodash'

export const TestPage1: React.FC = () => {
    
    return <div>
        <Header type="test1"></Header>
        <ThreeStockChartTest></ThreeStockChartTest>
    </div>
}
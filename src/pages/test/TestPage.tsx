import React, { useEffect, useState } from "react";
import { Header, ThreeStockChartTest } from "../../components";
import styles from "./TestPage.module.css"
import { useAppDispatch, useSelector } from "../../redux/hooks";
import { searchKPrice } from "../../redux/kprice/slice";
import { debounce } from 'lodash'

export const TestPage: React.FC = () => {
    
    return <div>
        <Header type="test"></Header>
        <ThreeStockChartTest></ThreeStockChartTest>
    </div>
}
import { Header, ThreeStockChart } from "../../components"
import React from "react"
import { useSelector } from "../../redux/hooks";

export const ThreeChartPage: React.FC = () => {
    return <div>
        <Header type="three"></Header>
        <ThreeStockChart></ThreeStockChart>
    </div>
}
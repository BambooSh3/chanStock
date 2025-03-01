import React from "react";
import styles from "./Header.module.css"
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "../../redux/hooks";

interface Props {
    type: "home" | "list" | "filter" | "block" | "three"
}


export const Header: React.FC<Props> = (prop) => {
    const navigate = useNavigate();
    const isMobile = useSelector((state) => state.periodChange.isMobile);
    function navListPage() {
        navigate("/listPage")
    }
    function navHomePage() {
        navigate('/')
    }
    function navFilterPage() {
        navigate('/filterPage')
    }
    // function navBlockPage() {
    //     navigate('/blockPage')
    // }
    function navThreePage() {
        navigate('/threeChartPage')
    }
    return <div className={styles.content}>
        {/* <div className={styles.title}>缠中说禅项目</div> */}
        <Button type="text" onClick={navHomePage} className={prop.type == 'home' ? styles.navbtnSelect : styles.navbtn}>首页</Button>
        {!isMobile && (
            <>
            <Button type="text" onClick={navThreePage} className={prop.type == 'three' ? styles.navbtnSelect : styles.navbtn}>三屏浏览</Button>
            <Button type="text" onClick={navListPage} className={prop.type == 'list' ? styles.navbtnSelect : styles.navbtn}>列表页</Button>
            <Button type="text" onClick={navFilterPage} className={prop.type == 'filter' ? styles.navbtnSelect : styles.navbtn}>智选</Button>
            {/* <Button type="text" onClick={navBlockPage} className={prop.type == 'block' ? styles.navbtnSelect : styles.navbtn}>双屏浏览</Button> */}
            </>
        )}
    </div>
};
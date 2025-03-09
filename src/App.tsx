import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import styles from "./App.module.css"
import { HomePage, ListPage, FilterPage, ThreeChartPage, TestPage} from './pages';
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { useAppDispatch, useSelector } from "./redux/hooks";
import Papa from 'papaparse';
import { loadCodeNameDicActionCreator, SET_IS_MOBILE, SET_IS_SMALL_PC } from "./redux/period/PeriodChangeAction";

function App() {
  const dispatch = useAppDispatch();
  const codeNameDic = useSelector((state) => state.periodChange.codeNameDic);
  // const isMobile = () => {
  //   const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
  //   const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  //   return mobilePattern.test(userAgent);
  // };
  useEffect(() => {
    if(Object.keys(codeNameDic).length < 10) {
        fetch('/code_name_dic.csv')
        .then((response) => response.text())
        .then((text) => {
           Papa.parse(text, {
               header: true,
               complete: function(result) {
                 let dic = {}
                 result.data.forEach(element => {
                     dic[element.code] = element.name
                 });
                 dispatch(loadCodeNameDicActionCreator(dic))
               }
           })    
       }); 
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
    };
    
  }, []);

  const handleResize = () => {
    const screenWidth = window.innerWidth;
    const mobileThreshold = 768;
    const smallPC = 1600
    dispatch({ type: SET_IS_MOBILE, payload: screenWidth < mobileThreshold });
    dispatch({ type: SET_IS_SMALL_PC, payload: screenWidth > mobileThreshold && screenWidth <= smallPC }); 
  };

  return (
    <div className={styles.App}>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<ThreeChartPage></ThreeChartPage>}></Route>
        <Route path="/listPage" element={<ListPage></ListPage>}></Route>
        <Route path="/filterPage" element={<FilterPage></FilterPage>}></Route>
        <Route path="/testPage" element={<TestPage></TestPage>}></Route> 
      </Routes>
      </BrowserRouter>
      
    </div>
  );
}

export default App;

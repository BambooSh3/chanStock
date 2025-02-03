import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import styles from "./App.module.css"
import { HomePage, ListPage, FilterPage, BlockPage, ThreeChartPage} from './pages';
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { useAppDispatch, useSelector } from "./redux/hooks";
import Papa from 'papaparse';
import { loadCodeNameDicActionCreator } from "./redux/period/PeriodChangeAction";

function App() {
  const dispatch = useAppDispatch();
  const codeNameDic = useSelector((state) => state.periodChange.codeNameDic);
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
}, []);
  return (
    <div className={styles.App}>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage></HomePage>}></Route>
        <Route path="/listPage" element={<ListPage></ListPage>}></Route>
        <Route path="/filterPage" element={<FilterPage></FilterPage>}></Route>
        <Route path="/blockPage" element={<BlockPage></BlockPage>}></Route>
        <Route path="/threeChartPage" element={<ThreeChartPage></ThreeChartPage>}></Route>
      </Routes>
      </BrowserRouter>
      
    </div>
  );
}

export default App;

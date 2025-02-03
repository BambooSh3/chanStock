import React, { useEffect, useState } from "react";
import styles from "./StockList.module.css"
import { Button } from "antd";
import { redirect, useNavigate } from "react-router-dom";
import { Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Papa from 'papaparse';
import { useSelector } from "../../redux/hooks";
import { useDispatch } from "react-redux";
import { changeCodeActionCreator, DataType } from "../../redux/period/PeriodChangeAction"
import { text } from "stream/consumers";
import { RowSelectionType, TableRowSelection } from "antd/es/table/interface";


interface Props {
    pageType: "homePage"| "listPage";
}

  
  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
  ];
  

export const StockList: React.FC = () => {
    const dispatch = useDispatch();
    const codeList = useSelector((state) => state.periodChange.codeList);
    // const [codeData, setCodeData] = useState<DataType[]>([])
    // useEffect(() => {
    //     fetch('/code.csv')
    //      .then((response) => response.text())
    //      .then((text) => {
    //         Papa.parse(text, {
    //             header: true,
    //             complete: function(result) {
    //                 const fileData = result.data.map((element, index)=>({
    //                     key: index + 1,
    //                     name: element.name,
    //                     code: element.code
    //                 }))
    //                 setCodeData(fileData)
    //             }
    //         })    
    //     });
    // }, []);

    function onClickRow(record) {
        if(record.code != null) {
            dispatch(changeCodeActionCreator(record.code))
        } else {
            console.log(record)
        }
    }
   
    return <Table columns={columns} dataSource={codeList} onRow={record => {
        return {
          onClick: () => onClickRow(record), // 点击行
        };
      } }/>
};
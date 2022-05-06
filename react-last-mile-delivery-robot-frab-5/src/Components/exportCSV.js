import React from "react";
import { Button } from "react-bootstrap";
import FileSaver from "file-saver";
import XLSX from "xlsx";

const ExportCSV = ({ csvData, fileName, wscols }) => {
  // ******** XLSX with object key as header *************
  // const fileType =
  //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  // const fileExtension = ".xlsx";

  // const exportToCSV = (csvData, fileName) => {
  //   const ws = XLSX.utils.json_to_sheet(csvData);
  //   const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
  //   const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  //   const data = new Blob([excelBuffer], { type: fileType });
  //   FileSaver.saveAs(data, fileName + fileExtension);
  // };

  // ******** XLSX with new header *************
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";

  const Heading = [
    {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      address: "Address",
      postcode: "Postcode"
    }
  ];

  const exportToCSV = (csvData, fileName, wscols) => {
    const ws = XLSX.utils.json_to_sheet(Heading, {
      header: ["firstName", "lastName", "email", "address", "postcode"],
      skipHeader: true,
      origin: 0 //ok
    });
    ws["!cols"] = wscols;
    XLSX.utils.sheet_add_json(ws, csvData, {
      header: ["firstName", "lastName", "email", "address", "postcode"],
      skipHeader: true,
      origin: -1 //ok
    });
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, fileName + fileExtension);
  };

  return (
    <Button
      variant="warning"
      onClick={e => exportToCSV(csvData, fileName, wscols)}
    >
      Export XLSX
    </Button>
  );
};

export default ExportCSV;
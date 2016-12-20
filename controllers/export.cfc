<cfcomponent accessors="true">
<cffunction
	name="exportExcel"
    access="public"
    output="true"
    returnformat="string"
>
<cfargument
            name="data"
            type="array"
            required="false"
            default=""
            />
<cfargument
            name="color"
            type="array"
            required="false"
            default=""
            />	
            
<cfoutput>
    <cfset var fileName = DateTimeFormat(now(), 'yyyy-mm-dd_HHnnss')&"_Report.xls" />
    <cfset var pathToFile = ExpandPath("templates/importSap.xls") /> 
	<cfset var pathToFile1 = ExpandPath("templates/#fileName#") /> 

    <!--- Read spreadsheet --->
    <cfspreadsheet action="read"
    src="#pathToFile#"
    name="sObj" />
    <cfset var x = 5 />
    <cfset var i = 0 />
    <cfloop array="#data#" index="row">
        <cfset  x++ />
        <cfset i++ />
        <!--- <cfdump eval ="color[i]" /> --->
        <cfset spreadsheetSetCellValue(sObj, '00'&row.purchaser, x, 1)/> 
        <cfif color[i].cus == 1 >
            <cfset SpreadSheetFormatCell(sObj, {fgcolor="yellow", color="violet", bold=true, alignment="center"}, x, 1) />
        </cfif>
        <cfset SpreadSheetSetRowHeight(sObj, x, 40) />

        <cfset spreadsheetSetCellValue(sObj, row.supplier_no, x, 2)/>
        <cfif color[i].sup == 1 >
            <cfset SpreadSheetFormatCell(sObj, {fgcolor="yellow", color="violet", bold=true, alignment="center"}, x, 2) />
        </cfif>

        <cfset spreadsheetSetCellValue(sObj, row.order_no, x, 3)/>

        <cfif row.position_no gt 9 >
            <cfset var position_no = '000'&row.position_no />
        <cfelse>
            <cfset var position_no = '0000'&row.position_no />
        </cfif>
        <cfset spreadsheetSetCellValue(sObj, position_no, x, 4)/>

        <cfset spreadsheetSetCellValue(sObj, row.item_no, x, 5)/>
        <cfif color[i].item == 1 >
            <cfset SpreadSheetFormatCell(sObj, {fgcolor="yellow", color="violet", bold=true, alignment="center"}, x, 5) />
        </cfif>

        <cfset spreadsheetSetCellValue(sObj, row.product_item_name, x, 6)/>

        <cfset var order_quantity = DecimalFormat(row.order_quantity) />
        <cfset spreadsheetSetCellValue(sObj, order_quantity, x, 7)/>

        <cfset spreadsheetSetCellValue(sObj, row.unit_price, x, 8)/>

        <cfset spreadsheetSetCellValue(sObj, row.currency, x, 9)/>
        <cfif color[i].curr == 1 >
            <cfset SpreadSheetFormatCell(sObj, {fgcolor="yellow", color="violet", bold=true, alignment="center"}, x, 9) />
        </cfif>

        <cfset spreadsheetSetCellValue(sObj, '', x, 10)/>
        <cfif row.ab_no gt 9 >
            <cfset var ab_no = '00'&row.ab_no />
        <cfelse>
            <cfset var ab_no = '000'&row.ab_no />
        </cfif>
        <cfset spreadsheetSetCellValue(sObj, ab_no, x, 11)/>
        <cfif color[i].abno == 1 >
            <cfset SpreadSheetFormatCell(sObj, {fgcolor="yellow", color="violet", bold=true, alignment="center"}, x, 11) />
        </cfif>

        <cfset var ab_quantity = DecimalFormat(row.ab_quantity) />
        <cfset spreadsheetSetCellValue(sObj, ab_quantity, x, 12)/>

        <cfset spreadsheetSetCellValue(sObj, '', x, 13)/>
        
        <cfset var expected_shipping_date = DateFormat( row.expected_shipping_date, 'dd/mm/yyyy' ) />
        <cfset spreadsheetSetCellValue(sObj, expected_shipping_date, x, 14)/>

        <cfset var confirmed_shipping_date = DateFormat( row.confirmed_shipping_date, 'dd/mm/yyyy' ) />
        <cfset spreadsheetSetCellValue(sObj, confirmed_shipping_date, x, 15)/>
        <cfset spreadsheetSetCellValue(sObj, '', x, 16)/>

        <cfset var order_date = DateFormat( row.order_date, 'dd/mm/yyyy' ) />
        <cfset spreadsheetSetCellValue(sObj, order_date, x, 17)/>
        <cfset spreadsheetSetCellValue(sObj, '', x, 18)/>

        <cfif trim(row.za_date) != '' >
            <cfset var za_date = DateFormat( row.za_date, 'dd/mm/yyyy' ) />
        <cfelse>
            <cfset var za_date = '' />
        </cfif>
        <cfset spreadsheetSetCellValue(sObj, za_date, x, 19)/>
        <cfif trim(row.za_date) != '' >
            <cfset SpreadSheetFormatCell(sObj, {fgcolor="white"}, x, 19) />
        </cfif>

        <cfif trim(row.shipping_date) != '' >
            <cfset var shipping_date = DateFormat( row.shipping_date, 'dd/mm/yyyy' ) />
        <cfelse>
            <cfset var shipping_date = '' />
        </cfif>
        <cfset spreadsheetSetCellValue(sObj, shipping_date, x, 20)/>
        <cfif trim(row.shipping_date) != '' >
            <cfset SpreadSheetFormatCell(sObj, {fgcolor="white"}, x, 20) />
        </cfif>

        <cfset var shipped_quantity = DecimalFormat(row.shipped_quantity) />
        <cfset spreadsheetSetCellValue(sObj, shipped_quantity, x, 21)/>
        <cfset spreadsheetSetCellValue(sObj, row.purchaser, x, 22)/>
        <cfset spreadsheetSetCellValue(sObj, row.planner, x, 23)/>
    </cfloop>
    <cfspreadsheet action="write" overwrite="true" 
    filename="#pathToFile1#" 
    name="sObj" 
    sheetname="Remain Order" 
    />

</cfoutput>
        <cfreturn fileName />
    </cffunction>
</cfcomponent>
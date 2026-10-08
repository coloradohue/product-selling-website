// Google Apps Script Backend for Product Store Data Storage
// This script will be deployed as a web app and handle data storage in Google Sheets

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Get or create spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Store Products
    storeProducts(spreadsheet, data.products);
    
    // Store Orders
    storeOrders(spreadsheet, data.orders);
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Data stored successfully",
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function storeProducts(spreadsheet, products) {
  // Get or create Products sheet
  let sheet = spreadsheet.getSheetByName("Products");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Products");
    sheet.appendRow([
      "Product ID",
      "Name",
      "Price",
      "Category",
      "Description",
      "Stock",
      "Created At",
      "Last Updated"
    ]);
  }
  
  // Clear existing data (keep header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  // Add products
  products.forEach(product => {
    sheet.appendRow([
      product.id,
      product.name,
      product.price,
      product.category,
      product.description,
      product.stock,
      product.createdAt,
      new Date().toISOString()
    ]);
  });
  
  // Format the sheet
  formatProductsSheet(sheet);
}

function storeOrders(spreadsheet, orders) {
  // Get or create Orders sheet
  let sheet = spreadsheet.getSheetByName("Orders");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Orders");
    sheet.appendRow([
      "Order ID",
      "Items",
      "Total Amount",
      "Status",
      "Order Date",
      "Stored At"
    ]);
  }
  
  // Clear existing data (keep header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  // Add orders
  orders.forEach(order => {
    const itemsText = order.items
      .map(item => `${item.name} x${item.quantity}`)
      .join("; ");
    
    sheet.appendRow([
      order.id,
      itemsText,
      order.total,
      order.status,
      order.date,
      new Date().toISOString()
    ]);
  });
  
  // Format the sheet
  formatOrdersSheet(sheet);
}

function formatProductsSheet(sheet) {
  const range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
  range.setHorizontalAlignment("center");
  
  // Header formatting
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground("#667eea");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");
  
  // Auto-resize columns
  for (let i = 1; i <= sheet.getLastColumn(); i++) {
    sheet.autoResizeColumn(i);
  }
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

function formatOrdersSheet(sheet) {
  const range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
  range.setHorizontalAlignment("center");
  
  // Header formatting
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground("#667eea");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");
  
  // Auto-resize columns
  for (let i = 1; i <= sheet.getLastColumn(); i++) {
    sheet.autoResizeColumn(i);
  }
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

// Function to get all data (for admin viewing)
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    const productsSheet = spreadsheet.getSheetByName("Products");
    const ordersSheet = spreadsheet.getSheetByName("Orders");
    
    let products = [];
    let orders = [];
    
    if (productsSheet) {
      const productsData = productsSheet.getDataRange().getValues();
      products = productsData.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        price: row[2],
        category: row[3],
        description: row[4],
        stock: row[5],
        createdAt: row[6],
        lastUpdated: row[7]
      }));
    }
    
    if (ordersSheet) {
      const ordersData = ordersSheet.getDataRange().getValues();
      orders = ordersData.slice(1).map(row => ({
        orderId: row[0],
        items: row[1],
        totalAmount: row[2],
        status: row[3],
        orderDate: row[4],
        storedAt: row[5]
      }));
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        products: products,
        orders: orders,
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to generate admin report
function generateAdminReport() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  let reportSheet = spreadsheet.getSheetByName("Admin Report");
  if (reportSheet) {
    spreadsheet.deleteSheet(reportSheet);
  }
  
  reportSheet = spreadsheet.insertSheet("Admin Report");
  
  const productsSheet = spreadsheet.getSheetByName("Products");
  const ordersSheet = spreadsheet.getSheetByName("Orders");
  
  reportSheet.appendRow(["ADMIN REPORT"]);
  reportSheet.appendRow([new Date().toISOString()]);
  reportSheet.appendRow([]);
  
  // Product Summary
  reportSheet.appendRow(["PRODUCT SUMMARY"]);
  if (productsSheet) {
    const productCount = productsSheet.getLastRow() - 1;
    const productsData = productsSheet.getDataRange().getValues().slice(1);
    
    reportSheet.appendRow(["Total Products", productCount]);
    
    let totalStock = 0;
    let totalValue = 0;
    
    productsData.forEach(row => {
      totalStock += row[5] || 0;
      totalValue += (row[2] || 0) * (row[5] || 0);
    });
    
    reportSheet.appendRow(["Total Stock", totalStock]);
    reportSheet.appendRow(["Total Inventory Value", "$" + totalValue.toFixed(2)]);
  }
  
  reportSheet.appendRow([]);
  
  // Order Summary
  reportSheet.appendRow(["ORDER SUMMARY"]);
  if (ordersSheet) {
    const orderCount = ordersSheet.getLastRow() - 1;
    reportSheet.appendRow(["Total Orders", orderCount]);
    
    const ordersData = ordersSheet.getDataRange().getValues().slice(1);
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    
    ordersData.forEach(row => {
      totalRevenue += row[2] || 0;
      if (row[3] === "pending") pendingOrders++;
      if (row[3] === "completed") completedOrders++;
    });
    
    reportSheet.appendRow(["Total Revenue", "$" + totalRevenue.toFixed(2)]);
    reportSheet.appendRow(["Pending Orders", pendingOrders]);
    reportSheet.appendRow(["Completed Orders", completedOrders]);
  }
  
  // Format report
  const headerRange = reportSheet.getRange(1, 1);
  headerRange.setFontSize(16);
  headerRange.setFontWeight("bold");
  
  reportSheet.autoResizeColumn(1);
  reportSheet.autoResizeColumn(2);
}

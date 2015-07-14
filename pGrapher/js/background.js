// handle of connection to main page
var myConnectionBg;
// prefix of every logs
var prefixBg = "background.js: \n\t";
// prefix of txtState
var prefixTs = "BT Connection State: <br />&emsp;";
// cuurrent socket ID
var curSocketId;
// smartcar BT information
var mySmartCarBtInfo;
// store the incomplete byte array
var incompleteBytes = [];
var recordBytes = [];
var recordSetting;
// password
//var passWord = "fish";
//
//var passWordChecked = false;
var isPlotting = false;
var isConnecting = false;
var isRetrying = false;
var allowReceive = false;
//
var hasWindow = false;
//
var windowSizeRatio = 0.5818815;
//
var channelString = "int32_t";
var typeNameArray = ["int8_t", "int16_t", "int32_t", "float"];
var sampleCount = 150;

//
var hWnd;
var hAppWindow;
//
var hTextState;
//var hTextLength;
var hLineChart;
var hButtonConnect;
var hButtonPlot;
var hCheckboxAutoconnect;
var hTextboxBtdevicename;
var hLoadingIcon;
var hScaleMin;
var hScaleMax;
var hScaleStep;
var hScaleSampleCount;
//var hChannelOption;
var hSharedVarsDisplayBoxes;
var hWatchedVarsDisplayBoxes;
//
var hTimer;
var hLoadingTimer;
var hGetVarsInfoTimer;

var afterResizeTimer;
var lastHeight;
var lastWidth;

//
var tempFloat;

var isProcessing = false;

// FileSystem
var isRecording = false;

// check if the variable is defined
var isDefined =
function(v)
{
  return (typeof v !== "undefined");
};

// print error msg
var printLastError =
function(txt)
{
  try
  {
    console.assert(!isDefined(chrome.runtime.lastError.string), prefixBg + txt + chrome.runtime.lastError.string);
    return false;
  }
  catch (e)
  {
    if (e.message == "Cannot read property 'string' of undefined")
      return true;
    else
      return false;
  }
};

var clearProc = 
function(sockets)
{
  for (var socket of sockets)
  {
    chrome.bluetoothSocket.disconnect(socket.socketId, generalErrorHandler);
    chrome.bluetoothSocket.close(socket.socketId, generalErrorHandler);
  }
};

var closeAllSockets = 
function()
{
  chrome.bluetoothSocket.getSockets(clearProc);
};

var socketRetry =
function(errorStr)
{
  if (isDefined(hTextState))
    hTextState.innerHTML = prefixTs + errorStr;
  isConnecting = false;
  isPlotting = false;
  allowReceive = false;
  hButtonConnect.value = "Connect";
  hButtonConnect.removeAttribute("disabled");
  hTextboxBtdevicename.removeAttribute("disabled");
  hButtonPlot.setAttribute("disabled", "");
  hLoadingIcon.setAttribute("hidden", "");
  hScaleMin.removeAttribute("disabled");
  hScaleMax.removeAttribute("disabled");
  hScaleStep.removeAttribute("disabled");
  hWnd.$("#control").prop("disabled", true);
  hButtonPlot.value = "Start";
  chrome.bluetoothSocket.setPaused(curSocketId, false, generalErrorHandler);
  incompleteBytes = [];
  recordBytes = [];
  WatchedDataConverter.nameList = [];
  WatchedDataConverter.typeIndex = [];
  WatchedDataConverter.byteCount = 0;
  SharedDataConverter.nameList = [];
  SharedDataConverter.typeIndex = [];
  SharedDataConverter.byteCount = 0;
  closeAllSockets();
  if (isDefined(hTimer))
  {
    if (isDefined(curSocketId))
    {
      chrome.bluetoothSocket.send(curSocketId, toArrayBufferWithInternalCommand('e'), checkConnection);
    }
    clearInterval(hTimer);
  }
  
  if (isDefined(hGetVarsInfoTimer))
    clearInterval(hGetVarsInfoTimer);
  
  if (hCheckboxAutoconnect.checked)
  {
    isRetrying = true;
    isConnecting = true;
    hButtonConnect.setAttribute("disabled", "");
    hTextboxBtdevicename.setAttribute("disabled", "");  
    hLoadingIcon.removeAttribute("hidden");
    hTextState.innerHTML = prefixTs + "Retry......";
    chrome.bluetooth.getAdapterState(connectSmartCar);
  }
  else if (isDefined(curSocketId))
  {
    isRetrying = false;
  }
};

var checkConnection = 
function(n)
{
  if (n === 0)
    socketRetry("Send Data Error...");
};

var generalErrorHandler =
function()
{
  try
  {
    constole.log(chrome.runtime.lastError.string);
  }
  catch (e) {}
};

var toArrayBufferWithInternalCommand = 
function(ch)
{
  var buf = new ArrayBuffer(7);
  var arr = new Uint8Array(buf);
  arr[0] = ch.charCodeAt();
  arr[1] = 1;
  for (var i = 2; i < 7; i++)
    arr[i] = 0;
  return buf;
};

var toArrayBuffer = 
function(ch)
{
  var buf = new ArrayBuffer(7);
  var arr = new Uint8Array(buf);
  arr[0] = ch.charCodeAt();
  for (var i = 1; i < 7; i++)
    arr[i] = 0;
  return buf;
};

var charCodetoArrayBuffer = 
function(cc)
{
  var buf = new ArrayBuffer(7);
  var arr = new Uint8Array(buf);
  arr[0] = cc;
  for (var i = 1; i < 7; i++)
    arr[i] = 0;
  return buf;
};

var graphReset = 
function(needFillZero)
{
  if (isDefined(hLineChart))
    hLineChart.destroy();

  var lineChartData = 
    {
      labels : [""],
      datasets :
      [
        {
        	label: "My First dataset",
        	fillColor : "rgba(255,0,0,0)",
        	strokeColor : "rgba(255,0,0,1)",
        	pointColor : "rgba(255,0,0,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(255,0,0,1)",
        	data : [0]
        },
        {
        	label: "My Second dataset",
        	fillColor : "rgba(0,255,0,0)",
        	strokeColor : "rgba(0,255,0,1)",
        	pointColor : "rgba(0,255,0,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(0,255,0,1)",
        	data : [0]
        },
        {
        	label: "My third dataset",
        	fillColor : "rgba(0,0,255,0)",
        	strokeColor : "rgba(0,0,255,1)",
        	pointColor : "rgba(0,0,255,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(0,0,255,1)",
        	data : [0]
        },
        {
        	label: "My forth dataset",
        	fillColor : "rgba(255,255,0,0)",
        	strokeColor : "rgba(255,255,0,1)",
        	pointColor : "rgba(255,255,0,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(255,255,0,1)",
        	data : [0]
        },
        {
        	label: "My fifth dataset",
        	fillColor : "rgba(255,0,255,0)",
        	strokeColor : "rgba(255,0,255,1)",
        	pointColor : "rgba(255,0,255,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(255,0,255,1)",
        	data : [0]
        },
        {
        	label: "My sixth dataset",
        	fillColor : "rgba(0,255,255,0)",
        	strokeColor : "rgba(0,255,255,1)",
        	pointColor : "rgba(0,255,255,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(0,255,255,1)",
        	data : [0]
        },
        {
        	label: "My seventh dataset",
        	fillColor : "rgba(255,153,0,0)",
        	strokeColor : "rgba(255,153,0,0)",
        	pointColor : "rgba(255,153,0,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(255,153,0,1)",
        	data : [0]
        },
        {
        	label: "My eighth dataset",
        	fillColor : "rgba(30,30,30,0)",
        	strokeColor : "rgba(30,30,30,1)",
        	pointColor : "rgba(30,30,30,1)",
        	pointStrokeColor : "#fff",
        	pointHighlightFill : "#fff",
        	pointHighlightStroke : "rgba(30,30,30,1)",
        	data : [0]
        }
      ]
    };
  
	hLineChart = new Chart(hWnd.document.getElementById("canvas").getContext("2d"))
	                      .Line(lineChartData,
                        {
                          responsive:	true,
                          animation:	false,
                          scaleOverride: true,
                          scaleSteps: parseInt(hScaleStep.value),
                          scaleStepWidth: parseFloat((hScaleMax.value - hScaleMin.value) / hScaleStep.value),
                          scaleStartValue: parseFloat(hScaleMin.value),
                          scaleIntegersOnly: false,
                          scaleShowGridLines : false,
                          scaleShowHorizontalLines: true,
                          scaleShowVerticalLines: false,
                          maintainAspectRatio: true,
                          tooltipFillColor: "rgba(0,0,0,0.6)",
                          tooltipFontColor: "#fff",
                          bezierCurve : false,
                          pointDot : false,
                          datasetStrokeWidth : 2,
                          barValueSpacing: 1
                        });
  
	hLineChart.reflow();
  
  if (needFillZero)
  	for (var i = 0; i < sampleCount; i++)
  		hLineChart.addDatasWithoutUpdate([0, 0, 0, 0, 0, 0, 0, 0]);
  
	hLineChart.update();
};

var WatchedDataConverter = 
{
  dataUpdate:
  function()
  {
    if (!incompleteBytes.length)
      return ;
      
    if (incompleteBytes.length <= this.bytesNeededPerFrame)
    {
      isProcessing = true;
      
      var l = parseInt(incompleteBytes.length / this.byteCount);
      for (var i = 0; i < l && l <= sampleCount; i++)
        this.plotData(i);
      
      hLineChart.update();
      //hTextLength.innerHTML = "Data Received: " + incompleteBytes.length + " B";
      isProcessing = false;
    }
    else
    {
      isProcessing = true;
      
      for (var j = incompleteBytes.length - this.bytesNeededPerFrame; j < incompleteBytes.length; j += this.byteCount)
        this.plotData(j);
      incompleteBytes = [];
        
      hLineChart.update();
      //hTextLength.innerHTML = "Data Received: " + incompleteBytes.length + " B";
      isProcessing = false;
    }
  },
  plotData:
  function(bytesStartIndex)
  {
    hLineChart.addAndRemoveDatasWithoutUpdate(this.getDataList());
  },
  getDataList:
  function(bytesStartIndex)
  {
    var retList = [];
    for (var i = 0; i < this.typeIndex.length; i++)
      retList.push(this.dispatch(i, bytesStartIndex));
    return retList;
  },
  dispatch:
  function(i, bytesStartIndex)
  {
    switch (this.typeIndex[i])
    {
      case 0:
        return (new Int8Array(this.getBluetoothData(bytesStartIndex, 1)))[0];
      case 1:
        return (new Int16Array(this.getBluetoothData(bytesStartIndex, 2)))[0];
      case 2:
        return (new Int32Array(this.getBluetoothData(bytesStartIndex, 4)))[0];
      case 3:
        return (new Float32Array(this.getBluetoothData(bytesStartIndex, 4)))[0];
      case 4:
        return (new Uint8Array(this.getBluetoothData(bytesStartIndex, 1)))[0];
      case 5:
        return (new Uint16Array(this.getBluetoothData(bytesStartIndex, 2)))[0];
      case 6:
        return (new Uint32Array(this.getBluetoothData(bytesStartIndex, 4)))[0];
    }
  },
  getBluetoothData:
  function(index, size)
  {
    return (new Int8Array(incompleteBytes.splice(index, size))).buffer;
  },
  typeIndex: [],
  byteCount: 0,
  bytesNeededPerFrame: 0,
  nameList: []
};

var SharedDataConverter = 
{
  anyToArrayBuffer:
  function(element, any)
  {
    var buf = new ArrayBuffer(7);
    var arr = new Uint8Array(buf);
    var index = hWnd.$(".displayBoxes").index(element);
    var v = new DataView(buf);
    
    switch (this.typeIndex[index])
    {
      case 0:
        v.setInt8(3, parseInt(any));
        break;
        
      case 1:
        v.setInt16(3, parseInt(any), true);
        break;
        
      case 2:
        v.setInt32(3, parseInt(any), true);
        break;
        
      case 3:
        v.setFloat32(3, parseFloat(any), true);
        break;
        
      case 4:
        v.setUint8(3, parseInt(any));
        break;
        
      case 5:
        v.setUint16(3, parseInt(any), true);
        break;
        
      case 6:
        v.setUint32(3, parseInt(any), true);
        break;
    }
    arr[0] = 'c'.charCodeAt();
    arr[1] = 1;
    arr[2] = index;
    
    return buf;
  },
  updateCurrentValue:
  function(index)
  {
    var v;
    
    switch (this.typeIndex[index])
    {
      case 0:
        v = (new Int8Array(incompleteBytes.splice(0, 1)))[0];
        break;
        
      case 1:
        v = new Int16Array(new Int8Array(incompleteBytes.splice(0, 2)).buffer)[0];
        break;
        
      case 2:
        v = new Int32Array(new Int8Array(incompleteBytes.splice(0, 4)).buffer)[0];
        break;
        
      case 3:
        // v = parseFloat((new Float32Array(incompleteBytes.splice(0, 4)))[0]);
        v = new Float32Array(new Int8Array(incompleteBytes.splice(0, 4)).buffer)[0];
        // v = ((new DataView(new ArrayBuffer(4)).setFloat32(incompleteBytes.splice(0, 4)))[0]).getInt32();
        break;
        
      case 4:
        v = (new Uint8Array(incompleteBytes.splice(0, 1)))[0];
        break;
        
      case 5:
        v = new Uint16Array(new Int8Array(incompleteBytes.splice(0, 2)).buffer)[0];
        break;
        
      case 6:
        v = new Uint32Array(new Int8Array(incompleteBytes.splice(0, 4)).buffer)[0];
        break;
        
    }
    hSharedVarsDisplayBoxes[index].children[0].children[4].value = v;
  },
  typeIndex: [],
  byteCount: 0,
  nameList: []
};

var onDataUpdate =
function()
{
  if (!isProcessing && isPlotting)
    WatchedDataConverter.dataUpdate();
};

var bluetoothOnReceive =
function(info)
{
  for (var byte of (new Int8Array(info.data)))
  {
    incompleteBytes.push(byte);
    if (isRecording)
      recordBytes.push(byte);
  }
};

var bluetoothOnReceiveError =
function(info)
{
  console.log(prefixBg + "OnReceiveError" + info.errorMessage);
  socketRetry("Disconnected...");
};

var normalBufferHandler = 
function(info)
{
  for (var byte of (new Int8Array(info.data)))
  {
    incompleteBytes.push(byte);
    if (isRecording)
      recordBytes.push(byte);
  }
};

var updateWatchedVars = 
function()
{
  if (typeof(WatchedDataConverter.typeIndex) != "string")
  {
    for (var i = 0; i < WatchedDataConverter.nameList.length; i++)
      hWatchedVarsDisplayBoxes.children[i].children[0].innerHTML = WatchedDataConverter.nameList[i];
    
    setAllWatchedDisplayBoxesEnabled(WatchedDataConverter.nameList.length);
  }
};

var updateSharedVars = 
function()
{
  for (var i = 0; i < SharedDataConverter.typeIndex.length; i++)
  {
    hSharedVarsDisplayBoxes[i].children[0].children[0].innerHTML = SharedDataConverter.nameList[i];
    hSharedVarsDisplayBoxes[i].children[0].children[3].innerHTML = getTypeStringFromIndex(SharedDataConverter.typeIndex[i]);
  }
  
  setAllSharedDisplayBoxesEnabled(SharedDataConverter.typeIndex.length);
  //chrome.storage.sync.set({'shownTypes_s': SharedDataConverter.typeIndex, 'dataCount_s': SharedDataConverter.typeIndex.length, 'nameList_s': SharedDataConverter.nameList, 'hasData': true});
};

var watchedVarHandler = 
function()
{
  if (String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.slice(-3))) == "end")
  {
    clearInterval(hGetVarsInfoTimer);
    
    WatchedDataConverter.nameList = [];
    WatchedDataConverter.typeIndex = [];
    WatchedDataConverter.byteCount = 0;
    
    if (incompleteBytes.splice(0, 1) == ','.charCodeAt())
    {
      var n = incompleteBytes.splice(0, 1)[0];
      for (var i = 0; i < n && String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.slice(0, 3))) != "end"; i++)
      {
        addTypeFromString(WatchedDataConverter, String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.splice(0, incompleteBytes.indexOf(0)))));
        incompleteBytes.shift();
        WatchedDataConverter.nameList.push(String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.splice(0, incompleteBytes.indexOf(0)))));
        incompleteBytes.shift();
        incompleteBytes.splice(0, 1);
      }
    }
    incompleteBytes = [];
    recordBytes = [];
    updateWatchedVars();
    
    if (isRecording)
      recordSetting = WatchedDataConverter;
      
    WatchedDataConverter.bytesNeededPerFrame = WatchedDataConverter.byteCount * sampleCount;
      
    chrome.bluetoothSocket.send(curSocketId, toArrayBufferWithInternalCommand('s'), checkConnection);
    hTimer = setInterval(onDataUpdate, 5);
  }
};

var sharedVarHandler = 
function()
{
  if (String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.slice(-3))) == "end")
  {
    clearInterval(hGetVarsInfoTimer);
    
    SharedDataConverter.nameList = [];
    SharedDataConverter.typeIndex = [];
    SharedDataConverter.byteCount = 0;
    
    if (incompleteBytes.splice(0, 1) == '.'.charCodeAt())
    {
      var n = incompleteBytes.splice(0, 1)[0];
      for (var i = 0; i < n && String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.slice(0, 3))) != "end"; i++)
      {
        addTypeFromString(SharedDataConverter, String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.splice(0, incompleteBytes.indexOf(0)))));
        incompleteBytes.shift();
        SharedDataConverter.nameList.push(String.fromCharCode.apply(null, new Uint8Array(incompleteBytes.splice(0, incompleteBytes.indexOf(0)))));
        incompleteBytes.shift();
        SharedDataConverter.updateCurrentValue(i);
        incompleteBytes.splice(0, 1);
      }
    }
    incompleteBytes = [];
    updateSharedVars();
    
    chrome.bluetoothSocket.send(curSocketId, toArrayBufferWithInternalCommand('w'), checkConnection);
    hGetVarsInfoTimer = setInterval(watchedVarHandler, 100);
  }
};

var bluetoothSocketOnConnected =
function()
{
  if (printLastError("Connect Error : "))
  {
    hTextState.innerHTML = prefixTs + "{ Connected }";
    hButtonConnect.removeAttribute("disabled");
    hButtonConnect.value = "Disconnect";
    isConnecting = false;
    isRetrying = false;
    allowReceive = false;
    hButtonPlot.removeAttribute("disabled");
    hLoadingIcon.setAttribute("hidden", "");
    hWnd.$("#control").prop("disabled", false);
    hWnd.$("#isRecorded").prop("disabled", false);
    chrome.bluetoothSocket.send(curSocketId, toArrayBufferWithInternalCommand('e'), checkConnection);
  }
  else
    socketRetry("Connection error...");
};

// connect to SmartCar after socket created
var bluetoothSocketOnCreated =
function(createInfo)
{
  curSocketId = createInfo.socketId;
  try
  {
    // try to connect to SmartCar
    chrome.bluetoothSocket.connect(curSocketId, mySmartCarBtInfo.address, mySmartCarBtInfo.uuids[0], bluetoothSocketOnConnected);
  }
  catch (e)
  {
    socketRetry("Error: 404 - Car not found!");
  }
};

var switchPlotting =
function()
{
  if (hButtonPlot.value == "Start")
  {
    hButtonPlot.value = "Stop";
    // hScaleMin.setAttribute("disabled", "");
    // hScaleMax.setAttribute("disabled", "");
    // hScaleStep.setAttribute("disabled", "");
    isRecording = hWnd.$("#isRecorded").is(":checked");
    hWnd.$("#isRecorded").prop("disabled", true);
    graphReset(true);
    isPlotting = true;
    allowReceive = false;
    recordBytes = [];
    incompleteBytes = [];
    
    chrome.bluetoothSocket.send(curSocketId, toArrayBufferWithInternalCommand('h'), checkConnection);
    hGetVarsInfoTimer = setInterval(sharedVarHandler, 100);
  }
  else if (hButtonPlot.value == "Stop")
  {
    if (isDefined(hTimer))
      clearInterval(hTimer);
      
    if (hGetVarsInfoTimer)
      clearInterval(hGetVarsInfoTimer);
      
    chrome.bluetoothSocket.send(curSocketId, toArrayBufferWithInternalCommand('e'), checkConnection);
    
    if (isRecording)
      chrome.storage.local.set({'lastRecord': recordBytes, 'lastRecordSetting': recordSetting});
    hWnd.$("#isRecorded").prop("disabled", false);
    
    hButtonPlot.value = "Start";
    // hScaleMin.removeAttribute("disabled");
    // hScaleMax.removeAttribute("disabled");
    // hScaleStep.removeAttribute("disabled");
    isPlotting = false;
    allowReceive = false;
    incompleteBytes = [];
    WatchedDataConverter.nameList = [];
    WatchedDataConverter.typeIndex = [];
    WatchedDataConverter.byteCount = 0;
  }
};

var connectSmartCar =
function(adapterInfo)
{
  //if (adapterInfo)
  if (!printLastError("BT Adapter Error: "))
  {
    socketRetry("BT Adapter Error");
    return;
  }
  else if(!adapterInfo.powered || !adapterInfo.available)
  {
    socketRetry("Bluetooth not available!");
    return;
  }
  
  // start discovering BT devices
  chrome.bluetooth.startDiscovery(generalErrorHandler);
  
  // stop discovering BT devices after 4 seconds
  setTimeout
  (
    function()
    {
      // get BT device list
      chrome.bluetooth.getDevices
      (
        function(deviceInfos)
        {
          // find SmartCar in the list
          for (var device of deviceInfos)
          {
            if (device.name == hTextboxBtdevicename.value)
            {
              // send SmartCar BT info to main page
              if (!isRetrying)
                hTextState.innerHTML = prefixTs + "SmartCar Paired... Connecting...";
              // TODO: show smartcar's info
              mySmartCarBtInfo = device;
              
              // create bluetooth socket
              chrome.bluetoothSocket.create(bluetoothSocketOnCreated);
              
              return ;
            }
          }
          hTextState.innerHTML = prefixTs + "Device Name not available!";
        }
      );
    },
    2000
  );
};

var onButtonClick = 
function(event)
{
  var button = event.target;
  
  switch (button.value)
  {
    case "Connect":
      if (!isConnecting)
      {
        closeAllSockets();
        isConnecting = true;
        hButtonConnect.setAttribute("disabled", "");
        hTextboxBtdevicename.setAttribute("disabled", "");
        hLoadingIcon.removeAttribute("hidden");
        chrome.bluetooth.getAdapterState(connectSmartCar);
      }
      break;
    case "Disconnect":
      socketRetry("Disconnected...");
      break;
    case "Start":
    case "Stop":
      switchPlotting();
      break;
  }
};

var onTextBoxFocus = 
function(event)
{
  if (event.target.id == "btDeviceName")
  {
    // start discovering BT devices
    chrome.bluetooth.startDiscovery(generalErrorHandler);
    
    // stop discovering BT devices after 4 seconds
    hGetDeviceTimer = setTimeout
    (
      function()
      {
        // get BT device list
        chrome.bluetooth.getDevices
        (
          function(deviceInfos)
          {
            for (; hTextboxBtdevicename.childNodes.length > 0;)
              hTextboxBtdevicename.removeChild(hTextboxBtdevicename.childNodes[0]);
            for (var device of deviceInfos)
            {
              var opt = document.createElement("option");
              opt.value = device.name;
              opt.innerText = device.name;
              hTextboxBtdevicename.appendChild(opt);
            }
          }
        );
      },
      2000
    );
  }
};

var onScaleTextBoxFocusOut = 
function(event)
{
  if (parseFloat(event.target.value) <= parseFloat(event.target.max) && parseFloat(event.target.value) >= parseFloat(event.target.min))
  {
    sampleCount = parseInt(hScaleSampleCount.value);
    if (event.target.id != "sampleCount")
      graphReset(true);
    chrome.storage.sync.set({'scaleMin': parseFloat(hScaleMin.value), 'scaleMax': parseFloat(hScaleMax.value), 'scaleStep': parseInt(hScaleStep.value), 'scaleSampleNum': sampleCount, 'hasData': true});
  }
  else
    event.target.value = event.target.defaultValue;
};

var getTypeStringFromIndex = 
function(index)
{
  switch (index)
  {
    case 0:
      return "int8_t";
    case 1:
      return "int16_t";
    case 2:
      return "int32_t";
    case 3:
      return "float";
    case 4:
      return "uint8_t";
    case 5:
      return "uint16_t";
    case 6:
      return "uint32_t";
  }
};

var addTypeFromString = 
function(Converter, typeString)
{
  switch (typeString)
  {
    case "signed char":
      Converter.typeIndex.push(0);
      Converter.byteCount += 1;
      break;
      
    case "short":
      Converter.typeIndex.push(1);
      Converter.byteCount += 2;
      break;
      
    case "int":
      Converter.typeIndex.push(2);
      Converter.byteCount += 4;
      break;
      
    case "float":
      Converter.typeIndex.push(3);
      Converter.byteCount += 4;
      break;
      
    case "unsigned char":
      Converter.typeIndex.push(4);
      Converter.byteCount += 1;
      break;
      
    case "unsigned short":
      Converter.typeIndex.push(5);
      Converter.byteCount += 2;
      break;
      
    case "unsigned int":
      Converter.typeIndex.push(6);
      Converter.byteCount += 4;
      break;
      
    default:
      console.log("wtf?");
      return ;
  }
};

// var onChannelOptionChanged = 
// function(event)
// {
//   // if (event.target.value.length == 0)
//   //   return ;
//   WatchedDataConverter.typeIndex = [];
//   WatchedDataConverter.byteCount = 0;
//   var typeList = (event.target.value.replace(/\s/g, "")).toLowerCase().split(",");
//   for (var type of typeList)
//     addTypeFromString(WatchedDataConverter, type);
//   channelString = event.target.value;
//   chrome.storage.sync.set({'shownTypes': channelString, 'hasData': true});
// };

// var onDeviceChangedHandler = 
// function(device)
// {
//   console.log(device);
// };

var onClosedHandler = 
function()
{
  closeAllSockets();
  if (isDefined(hTimer))
    clearInterval(hTimer);
  if (isDefined(hTimer))
  {
    chrome.bluetoothSocket.send(curSocketId, toArrayBufferWithInternalCommand('e'), checkConnection);
    clearInterval(hTimer);
  }
  hasWindow = false;
};

var setAllSharedDisplayBoxesEnabled = 
function(count)
{
  for (var i = 0; i < hSharedVarsDisplayBoxes.length; i++)
    if (i < count)
    {
      try
      {
        hSharedVarsDisplayBoxes[i].removeAttribute("hidden");
      }
      catch (e) {}
    }
    else
      hSharedVarsDisplayBoxes[i].setAttribute("hidden", "");
};

var setAllWatchedDisplayBoxesEnabled = 
function(count)
{
  for (var i = 0; i < hWatchedVarsDisplayBoxes.children.length; i++)
    if (i < count)
    {
      try
      {
        hWatchedVarsDisplayBoxes.children[i].removeAttribute("hidden");
      }
      catch (e) {}
    }
    else
      hWatchedVarsDisplayBoxes.children[i].setAttribute("hidden", "");
};

// prepare for connection to other pages
var connectPage =
function(createdWindow)
{
  hWnd = createdWindow.contentWindow;
  hAppWindow = createdWindow;
  lastHeight = hAppWindow.outerBounds.height;
  lastWidth = hAppWindow.outerBounds.width;
  
  hWnd.addEventListener
  (
    "load",
    function()
    {
      hTextState = hWnd.document.getElementById("textState");
      //hTextLength = hWnd.document.getElementById("textLength");
      
      hButtonConnect = hWnd.document.getElementById("connect");
      hButtonPlot = hWnd.document.getElementById("plotting");
      hCheckboxAutoconnect = hWnd.document.getElementById("autoConnection");
      hTextboxBtdevicename = hWnd.document.getElementById("btDeviceName");
      hLoadingIcon = hWnd.document.getElementById("loading");
      
      hScaleMin = hWnd.document.getElementById("min");
      hScaleMax = hWnd.document.getElementById("max");
      hScaleStep = hWnd.document.getElementById("step");
      //hChannelOption = hWnd.document.getElementById("channelType");
      hSharedVarsDisplayBoxes = hWnd.document.getElementsByClassName("displayBoxes");
      hWatchedVarsDisplayBoxes = hWnd.document.getElementById("watchedVarsList");
      
      setAllSharedDisplayBoxesEnabled(0);
      setAllWatchedDisplayBoxesEnabled(0);
      
      hButtonConnect.addEventListener("click", onButtonClick);
      hButtonPlot.addEventListener("click", onButtonClick);
      hTextboxBtdevicename.addEventListener("focus", onTextBoxFocus);
      hScaleMin.addEventListener("focusout", onScaleTextBoxFocusOut);
      hScaleMax.addEventListener("focusout", onScaleTextBoxFocusOut);
      hScaleStep.addEventListener("focusout", onScaleTextBoxFocusOut);
      hScaleSampleCount = hWnd.document.getElementById("sampleCount");
      hScaleSampleCount.addEventListener("focusout", onScaleTextBoxFocusOut);
      
      hWnd.$("#showRecord").click
      (
        function(e)
        {
          chrome.storage.local.get
          (
            ['lastRecord', 'lastRecordSetting'],
            function(items)
            {
              if (items)
              {
                incompleteBytes = items.lastRecord;
                WatchedDataConverter.nameList = items.lastRecordSetting.nameList;
                WatchedDataConverter.typeIndex = items.lastRecordSetting.typeIndex;
                WatchedDataConverter.byteCount = items.lastRecordSetting.byteCount;
                
                var strForExcel = "";
                
                var Mode = (!hWnd.$("#showType").prop("checked"));
                var isExternal = (hWnd.$("#isExternal").prop("checked"));
                
                if (isExternal)
                {
                  hWnd.$("#graph1").css({ "width": 5000, "height": 1500 });
                  hWnd.$("#canvas").prop({ "width": 10000, "height": 3000 });
                }
                
                graphReset(false);
                
                while (incompleteBytes.length >= WatchedDataConverter.byteCount)
                {
                  var dataList = WatchedDataConverter.getDataList();
                  
                  if (Mode)
                    hLineChart.addDatasWithoutUpdate(dataList);
                  else
                  {
                    for (var item of dataList)
                      strForExcel += item.toString() + "%09";
                    strForExcel += "%0A";
                  }
                }
                
                hLineChart.update();
                
                if (isExternal)
                {
                  if (Mode)
                    window.open(hLineChart.toBase64Image(), "", "toolbar=no, titlebar=no, width="+parseInt(hLineChart.scale.width+50)+", height="+parseInt(hLineChart.scale.height+50));
                  else
                    window.open("data:text/plain," + strForExcel, "", "toolbar=no, titlebar=no");
                }
                
                strForExcel = "";
                incompleteBytes = [];
                
                if (isExternal)
                {
                  hWnd.$("#graph1").css({ "width": '', "height": '' });
                  hWnd.$("#canvas").prop({ "width": 198, "height": 125 });
                  
                  graphReset(true);
                }

                WatchedDataConverter.nameList = [];
                WatchedDataConverter.typeIndex = [];
                WatchedDataConverter.byteCount = 0;
              }
            }
          );
        }
      );
      
      hWnd.$("#isExternal, label [for=isExternal]").click
      (
        function(e)
        {
          if (hWnd.$("#isExternal").prop("checked"))
            hWnd.$("#showType, label [for=showType]").prop("disabled", false);
          else
            hWnd.$("#showType, label [for=showType]").prop("disabled", true);
        }
      );
      
      hWnd.$("#isRecorded, label [for=isRecorded]").click
      (
        function(e)
        {
          if (hWnd.$("#isRecorded").prop("checked"))
            hWnd.$("#isExternal, label [for=isExternal]").prop("disabled", false);
          else
            hWnd.$("#isExternal, label [for=isExternal]").prop("disabled", true);
        }
      );
      
      hWnd.$("#showType, label [for=showType]").click
      (
        function(e)
        {
          if (hWnd.$("#showType").prop("checked"))
            hWnd.$("label[for='showType']").html("Type:Excel");
          else
            hWnd.$("label[for='showType']").html("Type:Graph");
        }
      );
      
      hWnd.$(window).resize
      (
        function(e)
        {
          console.log(e);
        }
      );
      
      hWnd.$("body").keypress
      (
        function(e)
        {
          if (e.keyCode == 13)
            switchPlotting();
        }
      );
      
      hWnd.$("#control").keypress
      (
        function(event)
        {
          chrome.bluetoothSocket.send(curSocketId, charCodetoArrayBuffer(event.keyCode), checkConnection);
          this.value = "";
          return true;
        }
      );
      
      hWnd.$(".displayBoxes .panelInput").focusout
      (
        function()
        {
          chrome.bluetoothSocket.send(curSocketId, SharedDataConverter.anyToArrayBuffer($(this).parent().parent()[0], $(this).val()), checkConnection);
        }
      );
      
      chrome.storage.sync.get
      (
        ['hasData', 'scaleMin', 'scaleMax', 'scaleStep', 'scaleSampleNum', 'shownTypes', 'dataCount', 'shownTypes_s', 'dataCount_s', 'nameList_s'],
        function(items)
        {
          if (items.hasData)
          {
            hScaleMin.value = items.scaleMin;
            hScaleMax.value = items.scaleMax;
            hScaleStep.value = items.scaleStep;
            hScaleSampleCount.value = items.scaleSampleNum;
            sampleCount = items.scaleSampleNum;
            channelString = items.shownTypes;
            //hChannelOption.value = channelString;
            // onChannelOptionChanged({target: hChannelOption});
            // WatchedDataConverter.typeIndex = items.shownTypes;
            // updateWatchedVars();
            // SharedDataConverter.typeIndex = items.shownTypes_s;
            // SharedDataConverter.nameList = items.nameList_s;
            // setAllSharedDisplayBoxesEnabled(parseInt(items.dataCount_s));
            // updateSharedVars();
          }
          
          graphReset(true);
        }
      );
      
      // get BT device list
      chrome.bluetooth.getDevices
      (
        function(deviceInfos)
        {
          for (var device of deviceInfos)
          {
            var opt = document.createElement("option");
            opt.value = device.name;
            opt.innerText = device.name;
            hTextboxBtdevicename.appendChild(opt);
          }
        }
      );
      
      hTextState.innerHTML = prefixTs + "Ready...";
    },
    true
  );
  
  // chrome.bluetooth.onDeviceChanged.addListener(onDeviceChangedHandler);
  
  createdWindow.onClosed.addListener(onClosedHandler);
  createdWindow.onBoundsChanged.addListener(onResizedHandler);
};

var onResizedHandler = 
function(e)
{
  clearTimeout(afterResizeTimer);
  afterResizeTimer = setTimeout
  (
    function()
    {
      if (lastHeight != hAppWindow.outerBounds.height || lastWidth != hAppWindow.outerBounds.width)
      {
        if (Math.abs(hAppWindow.outerBounds.height / hAppWindow.outerBounds.width - windowSizeRatio) > 0.005 && !hAppWindow.isMaximized())
          hAppWindow.outerBounds.setSize(Math.round(hAppWindow.outerBounds.width), Math.round(hAppWindow.outerBounds.width * windowSizeRatio));
        hLineChart.resize();
        hLineChart.reflow();
        hLineChart.update();
      }
    },
    750
  );
};

// TODO:  Use "onBoundsChanged" to keep window size ratio
//        Show color meaning
//        Random color
//        Set the y-axis range of the graph
//
// WISH:  Control/Start the car here

// create appWindow when the extension lauched
var onLaunched =
function()
{
  if (!hasWindow)
  {
    chrome.app.window.create
    (
      'page/main.html',
      {
        id: "main",
        outerBounds:
        {
          'width': 1420,
          'height': 830,
          'minWidth': 1420,
          'minHeight': 830,
          'left': 100,
          'top': 100
        }
        //'alwaysOnTop': true
      },
      connectPage
    );
    
    hasWindow = true;
  }
  return true;
};

// background.js starts here
chrome.app.runtime.onLaunched.addListener(onLaunched);
chrome.bluetoothSocket.onReceive.addListener(bluetoothOnReceive);
chrome.bluetoothSocket.onReceiveError.addListener(bluetoothOnReceiveError);

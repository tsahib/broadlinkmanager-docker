var con = 1;
var RfStatus;
$(document).ready(function () {

  $("#rescan").click(function () {
    $("#scan").hide();
    $("#bdevices").html('');
    $("#loading").show();
    getDevices('/discover');
  });

  $('#load').click(function(){
    $("#scan").hide();
    $("#bdevices").html('');
    $("#loading").show();
    $.ajax(
      {
        url: '/devices/load',
        dataType: "json",
        success: function (data) {
         
          showDevices(data);
          localStorage.setItem('devices', data);

   
        },
        error: function (e) {
  
        }
      });

  });


  $('#save').click(function () {
    Table2Json();
  });

  if (localStorage.getItem('devices') == null)
    getDevices('/autodiscover');
  else
    showDevices(localStorage.getItem('devices'));

  $("#convert").click(function () {
    var hex = $("#hex").val();
    $("#base").val(hexToBase64(hex));

  });

  $("#learnir").click(function () {
    $("#progress").text("Waiting For Signal....");
    $("#scaning").show();
    $("#data-wrapper").hide();
    $("#data").val('');
    learnIr($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val())
  });

  $("#learnrf").click(function () {
     $("#scaning").show();
    $("#data-wrapper").hide();
    $("#data").val('');
    RfStatus = setInterval(getRfStatus, 1000);
    learnrf($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val())

  });

  $("#send").click(function () {
    $("#progress").text("Sending Command....");
    $("#scaning").show();
    var command = $("#data").val();
    sendcommand($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val(), command)
  });

  $(document).on("click", ".actions", function (event) {
    var perifx = $(this).parent().attr('id');
    var device_name = $('#_name' + perifx).text();
    var device_type = $('#_type' + perifx).text();
    var device_ip = $('#_ip' + perifx).text();
    var device_mac = $('#_mac' + perifx).text();
    clearInterval(RfStatus);
    $("#scaning").hide();
    $("#device_name").val(device_name);
    $("#device_type").val(device_type);
    $("#device_ip").val(device_ip);
    $("#device_mac").val(device_mac);
    $("#modal-title").text(device_name + ' (' + device_ip + ')');
    $('#data').val('');
    $('#con').hide();
    $('#message').text('');

  });


  new ClipboardJS('#copydata');

  $('#sweeprf').click(function () {

    $.ajax(
      {
        url: '/rf/continue',
        dataType: "json",
        success: function (data) {
          $(this).hide();
        },
        error: function (e) {
          $(this).hide();
        }
      });

  });

});

function getDevices(url) {
  $.ajax(
    {
      url: url,
      dataType: "json",
      success: function (data) {
        localStorage.setItem('devices', data);
        showDevices(data);

      },
      error: function (e) {

      }
    });
}

function showDevices(data) {
  try {
    data = $.parseJSON(data);
  }
  catch (err) {
    getDevices();
  }
  i = 0;
  $.each(data, function (i, item) {
    var $tr = $('<tr>').append(
      $('<td id="_name_' + i + '" contenteditable="true">').text(item.name),
      $('<td id="_type_' + i + '">').text(item.type),
      $('<td id="_ip_' + i + '">').text(item.ip),
      $('<td id="_mac_' + i + '">').text(item.mac),
      $('<td id="_' + i + '" class="_no_json">').html('<button type="button" class="btn btn-primary  actions" data-toggle="modal" data-target="#modal-lg" title="Learn and send IR/RF codes">Actions</button>')

    );
    i++;
    $('#bdevices').append('<tr>' + $tr.wrap('<tr>').html() + '</tr>');
  });
  $("#loading").hide();
  $("#scan").show();
}

//IR Learn / Send

function learnIr(_type, _host, _mac) {
  $("#message").text('');
  $("#message").css('color', 'black');
  $.ajax(
    {

      url: 'ir/learn?type=' + _type + '&host=' + _host + '&mac=' + _mac,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        if (data.success == 0) {
          $('#data').val(data.data);
          $("#message").text(data.message);
          $("#message").css('color', 'red');
        }
        else {
          $("#message").text(data.message);
          $("#message").css('color', 'green');
          $('#data').val(hexToBase64(data.data));
        }
        $("#scaning").hide();
        $("#data-wrapper").show();
      },
      error: function (e) {

        $('#data').val('Error occurred while scanning, please try again');
        $("#scaning").hide();
        $("#data-wrapper").show();
      }
    });

}

function sendcommand(_type, _host, _mac, _command) {
  $("#message").css('color', 'black').text('');
  _command = base64ToHex(_command);
  $.ajax(
    {
      url: 'command/send?type=' + _type + '&host=' + _host + '&mac=' + _mac + '&command=' + _command,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        if (data.success == 0) {
          $('#data').val(data.data);
          $("#message").text(data.message);
          $("#message").css('color', 'red');
        }
        else {
          $("#message").text(data.message);
          $("#message").css('color', 'green');
          $('#data').val('');
        }
        $("#scaning").hide();
      },
      error: function (e) {

        $("#scaning").hide();
        $("#message").css('color', 'red');
        $("#message").text("Error sending Commad");
      }
    });

}

function learnrf(_type, _host, _mac) {
  $.ajax(
    {
      url: 'rf/learn?type=' + _type + '&host=' + _host + '&mac=' + _mac,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        if (data.success == 0)
          $('#message').text(data.data);
        else {
          $('#data').val(hexToBase64(data.data));
          $('#message').text("RF scan completed successfully");
        }

        clearInterval(RfStatus);
        $("#scaning").hide();
        $("#con").hide();
        $("#data-wrapper").show();
      },
      error: function (e) {
        $('#data').val('Error occurred while scanning, please try again');
        clearInterval(RfStatus);
        $("#scaning").hide();
        $("#data-wrapper").show();
        $("#con").hide();
      }
    });

}

function getRfStatus() {
  $.ajax(
    {
      url: '/rf/status',
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        $('#message').text(data._rf_sweep_message);

        if (data._rf_sweep_status == "True")
          $('#con').show();


      },
      error: function (e) {
        clearInterval(RfStatus);
        $('#message').text(data._rf_sweep_message);
      }
    });
}

function Table2Json() {
  var devices = [];
  var $headers = $("._th_json");
  var $rows = $("#bdevices tr").each(function (index) {
    $cells = $(this).find("td:not(._no_json)");
    devices[index] = {};
    $cells.each(function (cellIndex) {

      devices[index][$($headers[cellIndex]).data('json')] = $(this).html();
    });
  });

  // Let's put this in the object like you want and convert to JSON (Note: jQuery will also do this for you on the Ajax request)
  var myObj = {};
  myObj.devices = devices;
  localStorage.setItem('devices', JSON.stringify(devices));
  $.ajax({
    type: "POST",
    url: '/devices/save',
    data: JSON.stringify(devices),
    success: function (data) {
    
    },
    error: function (data) {
     
    },
    dataType: 'json'
  });


  
}

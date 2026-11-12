var lat, long, key_do_google, kmtotal, consumocarro, total1, promocaob2, tabelaidsaldo, lucro,
    lat0, lat1, lat2, latitude, longitude, valorlitro, polilinha, tabelaidgasto, totalcombustivel,
    saidaa, log0, log1, log2, total2, tabelaidgastodata, litrostotal, distanciatotal, distancia,
    tempo, tabelaidsaldodata, gastototal, tabelaidcorridavalor, endereco_texto, lng, tabelaidlogin,
    distanciap, hospedagemealimentacao, tabelaidloginnome, distanciap1, tabelaidcorridacliente, tabelaidcorridas;

var temParada = false;
var map;
var Circles = [];
var Polylines = [];
var Polygons = [];
var Makers = [];
var geocoder;

// Configurações iniciais
key_do_google = 'AIzaSyADjzaw8qYnzunedO0B9A145OuNJFeojO8';
tabelaidsaldo = '208538';
tabelaidgasto = '208539';
tabelaidgastodata = '1438289';
tabelaidsaldodata = '1438286';
tabelaidcorridavalor = '1438283';
tabelaidlogin = '208536';
tabelaidloginnome = '1438278';
tabelaidcorridacliente = '1438281';
tabelaidcorridas = '208537';

saidaa = 0; // 0 = Saída, 1 = Destino, 2 = Parada intermediária
kmtotal = 0;
lucro = 0;
totalcombustivel = 0;
litrostotal = 0;
gastototal = 0;
valorlitro = 4.20;
consumocarro = 13;
hospedagemealimentacao = 0;
promocaob2 = 0;
distanciatotal = 0;
tempo = '--';

// ==========================================
// FUNÇÃO DE ARREDONDAMENTO (0,00 ou 0,50)
// ==========================================
function arredondarParaMeio(valor) {
    return Math.round(Number(valor) * 2) / 2;
}

// ==========================================
// CÁLCULOS (Com arredondamento para 0,00 ou 0,50)
// ==========================================
function calculos() {
    let dist = txt_to_number(distanciatotal);
    let calc1 = (dist * 4.31) + 5;
    total1 = arredondarParaMeio(calc1);

    let calc2 = (dist * 5.06) + 5;
    total2 = arredondarParaMeio(calc2);

    $("#distancia").html(format_decimal_number(dist, 1, false) + ' KM');
    $("#tempo_estimado").html(tempo || '--');
    $("#bandeira1_val").html('B1=' + format_decimal_number(total1, 2, false));
    $("#bandeira2_val").html('B2=' + format_decimal_number(total2, 2, false));
}

function calculos2() {
    let dist = txt_to_number(distanciatotal);
    let calcV = dist * 3;
    let valorArredondado = arredondarParaMeio(calcV);
    total1 = valorArredondado;

    $("#tx1").html('Distancia: ' + format_decimal_number(dist, 1, false) + 'km');
    $("#tx2").html(String(tempo || '--'));
    $("#tx3").html('Aproximado R$' + format_decimal_number(valorArredondado, 2, false));

    if (dist > 500) {
        hospedagemealimentacao = 200.00;
        $("#div_4").show();
        $("#tx44").html('<span style="font-size:15px; color:#ffff00; font-weight:bold; font-style:italic;">Atenção Hotel (+R$ 200,00 nos custos)</span>');
    } else {
        hospedagemealimentacao = 0;
        $("#div_4").hide();
        $("#tx44").html('');
    }

    atualizarCustosAvancados();
}

function atualizarCustosAvancados() {
    let valConsumo = document.getElementById('txconsumo').value;
    let valLitro = document.getElementById('txlitro').value;

    consumocarro = (valConsumo === '' || txt_to_number(valConsumo) <= 0) ? 13 : txt_to_number(valConsumo);
    valorlitro = (valLitro === '' || txt_to_number(valLitro) <= 0) ? 4.20 : txt_to_number(valLitro);

    kmtotal = txt_to_number(distanciatotal * 2);
    totalcombustivel = (kmtotal / consumocarro) * valorlitro;
    litrostotal = kmtotal / consumocarro;
    gastototal = totalcombustivel + Number(hospedagemealimentacao);
    lucro = Number(total1) - gastototal;

    $("#tx5").html('KM total : ' + format_decimal_number(kmtotal, 1, false));
    $("#tx7").html(
        format_decimal_number(litrostotal, 2, false) + ' Litros / R$ ' + format_decimal_number(totalcombustivel, 2, false)
    );
    $("#tx_lucro").html('R$ ' + format_decimal_number(lucro, 2, false));
    $("#telaresutado").show();
}

// ==========================================
// CONTROLE DE MARCADORES, LINHAS E MAPA
// ==========================================
function limparPolylines() {
    for (var i = 0; i < Polylines.length; i++) {
        Polylines[i].setMap(null);
    }
    Polylines = [];
}

function removerMarcadorPorId(id) {
    for (var i = Makers.length - 1; i >= 0; i--) {
        if (Makers[i].marker_id === id) {
            Makers[i].setMap(null);
            Makers.splice(i, 1);
        }
    }
}

function adicionarOuAtualizarMarcador(id, latitudeVal, longitudeVal) {
    removerMarcadorPorId(id);

    let labelMap = { 0: 'A', 1: 'B', 2: 'P' };
    let titleMap = { 0: 'Saída', 1: 'Destino', 2: 'Parada' };

    var marker = new google.maps.Marker({
        position: { lat: latitudeVal, lng: longitudeVal },
        map: map,
        marker_id: id,
        label: {
            text: labelMap[id] || '',
            color: '#ffffff',
            fontWeight: 'bold'
        },
        title: titleMap[id] || ''
    });

    Makers.push(marker);
    ajustarZoomMapa();
}

function ajustarZoomMapa() {
    if (Makers.length === 0) return;
    if (Makers.length === 1) {
        map.panTo(Makers[0].getPosition());
        map.setZoom(15);
        return;
    }
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < Makers.length; i++) {
        bounds.extend(Makers[i].getPosition());
    }
    map.fitBounds(bounds, { top: 210, bottom: 40, left: 30, right: 30 });
}

function definirAlvoAtivo(novoAlvo) {
    saidaa = novoAlvo;
    $("#endereco_saida, #endereco_destino, #endereco_parada").removeClass("active-target");

    if (saidaa === 0) {
        $("#endereco_saida").addClass("active-target");
        $("#indicador_toque_mapa").text("Toque no mapa: Saída");
    } else if (saidaa === 1) {
        $("#endereco_destino").addClass("active-target");
        $("#indicador_toque_mapa").text("Toque no mapa: Destino");
    } else if (saidaa === 2) {
        $("#endereco_parada").addClass("active-target");
        $("#indicador_toque_mapa").text("Toque no mapa: Parada");
    }
}

function preencherEnderecoPorCoordenada(latLng, inputSelector) {
    if (!geocoder) return;
    geocoder.geocode({ location: latLng }, function (results, status) {
        if (status === "OK" && results[0]) {
            $(inputSelector).val(results[0].formatted_address);
        }
    });
}

// ==========================================
// TRAÇADO DE ROTA DINÂMICO
// ==========================================
function verificarETraçarRota() {
    if (lat0 !== undefined && log0 !== undefined && lat1 !== undefined && log1 !== undefined) {
        linha();
    }
}

function formatarSegundos(segundos) {
    let horas = Math.floor(segundos / 3600);
    let minutos = Math.round((segundos % 3600) / 60);
    if (horas > 0) {
        return horas + "h " + minutos + " min";
    }
    return minutos + " min";
}

function linha() {
    if (lat0 === undefined || log0 === undefined || lat1 === undefined || log1 === undefined) {
        return;
    }

    limparPolylines();
    let directionsService = new google.maps.DirectionsService();

    let waypoints = [];
    if (temParada && lat2 !== undefined && log2 !== undefined) {
        waypoints.push({
            location: new google.maps.LatLng(lat2, log2),
            stopover: true
        });
    }

    let request = {
        origin: new google.maps.LatLng(lat0, log0),
        destination: new google.maps.LatLng(lat1, log1),
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        durationInTraffic: true
    };

    directionsService.route(request, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            let route = response.routes[0];
            polilinha = route.overview_polyline;

            var polyline = new google.maps.Polyline({
                strokeColor: waypoints.length > 0 ? "#333333" : "#cc1650",
                strokeOpacity: 0.9,
                strokeWeight: 4,
                map: map
            });
            polyline.polyline_id = 10;
            polyline.setPath(google.maps.geometry.encoding.decodePath(polilinha));
            Polylines.push(polyline);

            let metrosTotais = 0;
            let segundosTotais = 0;
            for (let i = 0; i < route.legs.length; i++) {
                metrosTotais += route.legs[i].distance.value;
                segundosTotais += route.legs[i].duration.value;
            }

            distanciatotal = Number((metrosTotais / 1000).toFixed(2));
            tempo = formatarSegundos(segundosTotais);

            calculos();
            ajustarZoomMapa();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Rota não encontrada',
                text: 'Não foi possível calcular o trajeto entre os pontos selecionados.',
                timer: 2500,
                showConfirmButton: false
            });
        }
    });
}

// ==========================================
// INICIALIZAÇÃO DO GOOGLE MAPS
// ==========================================
function initMap() {
    map = new google.maps.Map(document.getElementById('tela_mapa'), {
        center: { lat: -14.851078, lng: -40.848206 },
        zoom: 13
    });
    geocoder = new google.maps.Geocoder();

    onMapInitilize();

    google.maps.event.addListener(map, 'click', function (event) {
        onMapClick(event);
    });
}

var script = document.createElement("script");
script.src = "https://maps.googleapis.com/maps/api/js?key=" + key_do_google + "&libraries=places,geometry&callback=initMap&loading=async";
script.async = true;
document.head.appendChild(script);

function configurarAutocompleteCampo(inputId, pontoId) {
    var input = document.getElementById(inputId);
    let center = new google.maps.LatLng(-14.851078, -40.848206);
    let circle = new google.maps.Circle({ center: center, radius: 15000 });
    let options = { bounds: circle.getBounds() };

    let autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete.addListener("place_changed", () => {
        let place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();

        if (pontoId === 0) {
            lat0 = lat;
            log0 = lng;
            adicionarOuAtualizarMarcador(0, lat0, log0);
            if (lat1 === undefined) definirAlvoAtivo(1);
        } else if (pontoId === 1) {
            lat1 = lat;
            log1 = lng;
            adicionarOuAtualizarMarcador(1, lat1, log1);
        } else if (pontoId === 2) {
            lat2 = lat;
            log2 = lng;
            adicionarOuAtualizarMarcador(2, lat2, log2);
            if (lat1 === undefined) definirAlvoAtivo(1);
        }

        verificarETraçarRota();
    });
}

function onMapInitilize() {
    map.setOptions({
        streetViewControl: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        fullscreenControl: false
    });

    configurarAutocompleteCampo('endereco_saida', 0);
    configurarAutocompleteCampo('endereco_destino', 1);
    configurarAutocompleteCampo('endereco_parada', 2);
}

function onMapClick(event) {
    lat = event.latLng.lat();
    long = event.latLng.lng();

    if (saidaa === 0) {
        lat0 = lat;
        log0 = long;
        adicionarOuAtualizarMarcador(0, lat0, log0);
        preencherEnderecoPorCoordenada(event.latLng, '#endereco_saida');
        definirAlvoAtivo(1);
    } else if (saidaa === 1) {
        lat1 = lat;
        log1 = long;
        adicionarOuAtualizarMarcador(1, lat1, log1);
        preencherEnderecoPorCoordenada(event.latLng, '#endereco_destino');
    } else if (saidaa === 2) {
        lat2 = lat;
        log2 = long;
        adicionarOuAtualizarMarcador(2, lat2, log2);
        preencherEnderecoPorCoordenada(event.latLng, '#endereco_parada');
        definirAlvoAtivo(1);
    }

    verificarETraçarRota();
}

// ==========================================
// EVENTOS
// ==========================================
$(document).ready(function () {
    $("#loading-page-bb").css("opacity", "1");

    $("#endereco_saida").on("focus click", function () { definirAlvoAtivo(0); });
    $("#endereco_destino").on("focus click", function () { definirAlvoAtivo(1); });
    $("#endereco_parada").on("focus click", function () { definirAlvoAtivo(2); });

    $("#location").on("click", function () {
        definirAlvoAtivo(0);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                lat0 = position.coords.latitude;
                log0 = position.coords.longitude;
                adicionarOuAtualizarMarcador(0, lat0, log0);
                preencherEnderecoPorCoordenada({ lat: lat0, lng: log0 }, '#endereco_saida');
                if (lat1 === undefined) definirAlvoAtivo(1);
                verificarETraçarRota();
            }, function () {
                Swal.fire('Aviso', 'Não foi possível obter sua localização atual.', 'warning');
            });
        }
    });

    $("#btn_add_parada").on("click", function () {
        temParada = true;
        $("#grupo_parada").slideDown(150);
        $("#btn_add_parada").hide();
        definirAlvoAtivo(2);
        $("#endereco_parada").focus();
    });

    $("#btn_remover_parada").on("click", function () {
        temParada = false;
        lat2 = undefined;
        log2 = undefined;
        $("#endereco_parada").val('');
        $("#grupo_parada").slideUp(150);
        $("#btn_add_parada").show();
        removerMarcadorPorId(2);
        definirAlvoAtivo(1);
        verificarETraçarRota();
    });

    $("#btn_limpar").on("click", function () {
        lat0 = log0 = lat1 = log1 = lat2 = log2 = undefined;
        distanciatotal = 0;
        total1 = 0;
        total2 = 0;
        tempo = '--';
        temParada = false;

        $("#endereco_saida, #endereco_destino, #endereco_parada").val('');
        $("#grupo_parada").hide();
        $("#btn_add_parada").show();
        $("#distancia").html('0 KM');
        $("#tempo_estimado").html('--');
        $("#bandeira1_val").html('B1=0.00');
        $("#bandeira2_val").html('B2=0.00');

        limparPolylines();
        for (var i = 0; i < Makers.length; i++) {
            Makers[i].setMap(null);
        }
        Makers = [];
        definirAlvoAtivo(0);
    });

    $("#vai").on("click", function () {
        verificarETraçarRota();
    });

    $("#btnresumo, #extra").on("click", function () {
        window.location.href = "index.html";
    });

    $("#btnavancado").on("click", function () {
        calculos2();
        $("#card_iniciar").hide();
        $("#cardavanced").fadeIn(150);
    });

    $("#btn_voltar_mapa").on("click", function () {
        if (distanciatotal > 0) calculos();
        $("#cardavanced").hide();
        $("#card_iniciar").fadeIn(150);
    });

    $("#txconsumo, #txlitro").on("input", function () {
        atualizarCustosAvancados();
    });

    $("#callinform2").on("click", function () {
        atualizarCustosAvancados();
    });
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
function txt_to_number(txt) {
    if (txt === undefined || txt === null) return 0;
    txt = txt + "";
    if (txt.includes(",")) {
        txt = txt.replace(",", ".");
    }
    let num = parseFloat(txt);
    return isNaN(num) ? 0 : num;
}

function format_decimal_number(number, places, virgula = false) {
    let num = Number(number);
    if (isNaN(num)) num = 0;
    let res = num.toFixed(places);
    if (virgula) {
        res = res.replace(".", ",");
    }
    return res;
}
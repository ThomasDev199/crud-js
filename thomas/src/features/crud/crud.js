const KEY = "registros";
const COLORES = ["#ffd166", "#7cf0c4", "#ff9fb2", "#a5b4ff", "#ffb68a"];

const ICONO_EDITAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`;
const ICONO_ELIMINAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/></svg>`;

const formulario = document.getElementById("formulario");
const inputCorreo = document.getElementById("correo");
const inputNombre = document.getElementById("nombre");
const inputDocumento = document.getElementById("documento");
const mensaje = document.getElementById("mensaje");
const btnAgregar = document.getElementById("btnAgregar");
const btnCancelar = document.getElementById("btnCancelar");
const tituloForm = document.getElementById("tituloForm");
const tabla = document.getElementById("tabla");
const contador = document.getElementById("contador");
const contadorTxt = document.getElementById("contadorTxt");
const buscar = document.getElementById("buscar");

const carnet = document.getElementById("carnet");
const pvAvatar = document.getElementById("pvAvatar");
const pvNombre = document.getElementById("pvNombre");
const pvCorreo = document.getElementById("pvCorreo");
const pvDoc = document.getElementById("pvDoc");
const pvBarras = document.getElementById("pvBarras");

// Posición del registro que se está editando (null = modo agregar)
let editando = null;
// Posición de la fila que debe destacarse tras guardar
let resaltar = null;
// Texto del buscador
let filtro = "";

/* ---------- Utilidades ---------- */

function obtenerRegistros() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
        return [];
    }
}

function guardarRegistros(registros) {
    localStorage.setItem(KEY, JSON.stringify(registros));
}

// Evita que el texto escrito por el usuario se interprete como HTML
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function iniciales(nombre) {
    const letras = nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("");
    return letras ? letras.toUpperCase() : "?";
}

function colorDe(texto) {
    let suma = 0;
    for (const c of texto) suma += c.charCodeAt(0);
    return COLORES[suma % COLORES.length];
}

// Código de barras decorativo que depende del número de documento
function dibujarBarras(texto) {
    let x = 0;
    let barras = "";
    for (const c of texto) {
        const n = c.charCodeAt(0);
        const ancho = 1 + (n % 3);
        const hueco = 1 + ((n >> 2) % 2);
        barras += `<rect x="${x}" y="0" width="${ancho}" height="44" fill="#12143a"/>`;
        x += ancho + hueco;
    }
    pvBarras.setAttribute("viewBox", `0 0 ${Math.max(x, 1)} 44`);
    pvBarras.innerHTML = barras;
}

/* ---------- Carnet en vivo ---------- */

function actualizarCarnet() {
    const nombre = inputNombre.value.trim();
    const correo = inputCorreo.value.trim();
    const documento = inputDocumento.value.trim();

    pvAvatar.textContent = iniciales(nombre);
    pvAvatar.style.background = colorDe(documento || nombre || "x");
    pvNombre.textContent = nombre || "Tu nombre";
    pvCorreo.textContent = correo || "correo@ejemplo.com";
    pvDoc.textContent = documento || "0000000000";
    dibujarBarras(documento || "0000000000");
}

function sellarCarnet() {
    carnet.classList.remove("sellar");
    void carnet.offsetWidth; // reinicia la animación
    carnet.classList.add("sellar");
}

/* ---------- Tabla ---------- */

function mostrarTabla() {
    const registros = obtenerRegistros();
    tabla.innerHTML = "";

    contador.textContent = registros.length;
    contadorTxt.textContent = registros.length === 1 ? "persona" : "personas";

    if (registros.length === 0) {
        tabla.innerHTML = `
            <tr><td class="vacio" colspan="3">
                <strong>Aún no hay personas registradas</strong>
                Completa el formulario y pulsa Agregar.
            </td></tr>`;
        return;
    }

    const texto = filtro.trim().toLowerCase();
    let mostradas = 0;

    registros.forEach((r, i) => {
        const coincide = !texto ||
            r.nombre.toLowerCase().includes(texto) ||
            r.correo.toLowerCase().includes(texto) ||
            r.documento.toLowerCase().includes(texto);
        if (!coincide) return;
        mostradas++;

        const fila = document.createElement("tr");
        fila.style.setProperty("--c", colorDe(r.documento));
        if (i === resaltar) fila.classList.add("nuevo");
        fila.innerHTML = `
            <td>
                <div class="persona">
                    <span class="avatar" style="background:${colorDe(r.documento)}">${escapar(iniciales(r.nombre))}</span>
                    <span>
                        <b>${escapar(r.nombre)}</b>
                        <span>${escapar(r.correo)}</span>
                    </span>
                </div>
            </td>
            <td class="doc">${escapar(r.documento)}</td>
            <td class="celda-acciones">
                <div class="acciones">
                    <button type="button" class="btn btn-chico btn-editar" data-accion="editar" data-i="${i}">${ICONO_EDITAR}Editar</button>
                    <button type="button" class="btn btn-chico btn-eliminar" data-accion="eliminar" data-i="${i}">${ICONO_ELIMINAR}Eliminar</button>
                </div>
            </td>`;
        tabla.appendChild(fila);
    });

    if (mostradas === 0) {
        tabla.innerHTML = `
            <tr><td class="vacio" colspan="3">
                <strong>Sin resultados</strong>
                Ninguna persona coincide con "${escapar(filtro)}".
            </td></tr>`;
    }
    resaltar = null;
}

/* ---------- Formulario ---------- */

function limpiarErrores() {
    mensaje.textContent = "";
    [inputCorreo, inputNombre, inputDocumento].forEach(i => i.classList.remove("invalido"));
}

function mostrarError(texto, campo) {
    limpiarErrores();
    mensaje.textContent = texto;
    if (campo) {
        campo.classList.add("invalido");
        campo.focus();
    }
}

function limpiarFormulario() {
    formulario.reset();
    editando = null;
    btnAgregar.textContent = "Agregar";
    tituloForm.textContent = "Nueva persona";
    btnCancelar.hidden = true;
    limpiarErrores();
    actualizarCarnet();
}

function guardar(e) {
    e.preventDefault();

    const correo = inputCorreo.value.trim().toLowerCase();
    const nombre = inputNombre.value.trim();
    const documento = inputDocumento.value.trim();

    if (!correo) return mostrarError("Escribe un correo electrónico.", inputCorreo);
    if (!/^\S+@\S+\.\S+$/.test(correo)) return mostrarError("El correo no tiene un formato válido.", inputCorreo);
    if (!nombre) return mostrarError("Escribe un nombre.", inputNombre);
    if (!documento) return mostrarError("Escribe un número de documento.", inputDocumento);

    const registros = obtenerRegistros();

    // Actividad 2: correo y documento únicos (ignora el registro que se edita)
    if (registros.some((r, i) => r.correo === correo && i !== editando)) {
        return mostrarError("Ya existe un registro con ese correo electrónico.", inputCorreo);
    }
    if (registros.some((r, i) => r.documento === documento && i !== editando)) {
        return mostrarError("Ya existe un registro con ese número de documento.", inputDocumento);
    }

    if (editando === null) {
        registros.push({ correo, nombre, documento });
        resaltar = registros.length - 1;
    } else {
        registros[editando] = { correo, nombre, documento };
        resaltar = editando;
    }

    guardarRegistros(registros);
    sellarCarnet();
    limpiarFormulario();
    mostrarTabla();
}

// Actividad 1: eliminar (de la tabla y del localStorage)
function eliminar(i, fila) {
    const quitar = () => {
        const registros = obtenerRegistros();
        registros.splice(i, 1);
        guardarRegistros(registros);
        if (editando === i) limpiarFormulario();
        else if (editando !== null && editando > i) editando--;
        mostrarTabla();
    };
    fila.classList.add("saliendo");
    setTimeout(quitar, 180);
}

// Actividad 1: editar
function editar(i) {
    const r = obtenerRegistros()[i];
    inputCorreo.value = r.correo;
    inputNombre.value = r.nombre;
    inputDocumento.value = r.documento;
    editando = i;
    btnAgregar.textContent = "Guardar cambios";
    tituloForm.textContent = "Editar persona";
    btnCancelar.hidden = false;
    limpiarErrores();
    actualizarCarnet();
    inputNombre.focus();
    formulario.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- Eventos ---------- */

formulario.addEventListener("submit", guardar);
btnCancelar.addEventListener("click", limpiarFormulario);

[inputCorreo, inputNombre, inputDocumento].forEach(input => {
    input.addEventListener("input", () => {
        input.classList.remove("invalido");
        actualizarCarnet();
    });
});

buscar.addEventListener("input", () => {
    filtro = buscar.value;
    mostrarTabla();
});

tabla.addEventListener("click", e => {
    const boton = e.target.closest("button[data-accion]");
    if (!boton) return;
    const i = Number(boton.dataset.i);
    if (boton.dataset.accion === "editar") editar(i);
    if (boton.dataset.accion === "eliminar") eliminar(i, boton.closest("tr"));
});

actualizarCarnet();
mostrarTabla();
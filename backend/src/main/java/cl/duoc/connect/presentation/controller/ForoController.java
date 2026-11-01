package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.CrearPreguntaRequest;
import cl.duoc.connect.application.dto.request.CrearRespuestaRequest;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.dto.response.PreguntaResponse;
import cl.duoc.connect.application.dto.response.RespuestaResponse;
import cl.duoc.connect.application.dto.response.VotoResponse;
import cl.duoc.connect.application.service.ForoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/foro")
@RequiredArgsConstructor
@Tag(name = "Foro", description = "Foro académico de preguntas y respuestas")
@SecurityRequirement(name = "bearerAuth")
public class ForoController {

    private final ForoService foroService;

    @GetMapping("/preguntas")
    @Operation(summary = "Listar y filtrar preguntas")
    public ApiResponse<PageResponse<PreguntaResponse>> buscarPreguntas(
            @RequestParam(required = false) UUID carreraId,
            @RequestParam(required = false) UUID asignaturaId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "TODAS") String estado,
            @RequestParam(defaultValue = "recientes") String orden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(foroService.buscarPreguntas(carreraId, asignaturaId, q, estado, orden, page, size));
    }

    @PostMapping(value = "/preguntas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Publicar una pregunta (imagen opcional: JPG, PNG o WebP, máx. 2 MB)")
    public ApiResponse<PreguntaResponse> crearPregunta(
            @Valid @ModelAttribute CrearPreguntaRequest request,
            @RequestParam(value = "imagen", required = false) MultipartFile imagen) {
        return ApiResponse.ok(foroService.crearPregunta(request, imagen), "Pregunta publicada");
    }

    @GetMapping("/preguntas/{id}")
    @Operation(summary = "Detalle de una pregunta con sus respuestas")
    public ApiResponse<PreguntaResponse> obtenerPregunta(@PathVariable UUID id) {
        return ApiResponse.ok(foroService.obtenerPregunta(id));
    }

    @PostMapping("/preguntas/{id}/respuestas")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Responder una pregunta")
    public ApiResponse<RespuestaResponse> responder(
            @PathVariable UUID id,
            @Valid @RequestBody CrearRespuestaRequest request) {
        return ApiResponse.ok(foroService.responder(id, request.getContenido()), "Respuesta publicada");
    }

    @PostMapping("/preguntas/{id}/votos")
    @Operation(summary = "Votar o quitar el voto de una pregunta")
    public ApiResponse<VotoResponse> votarPregunta(@PathVariable UUID id) {
        return ApiResponse.ok(foroService.votarPregunta(id));
    }

    @PostMapping("/respuestas/{id}/votos")
    @Operation(summary = "Votar o quitar el voto de una respuesta")
    public ApiResponse<VotoResponse> votarRespuesta(@PathVariable UUID id) {
        return ApiResponse.ok(foroService.votarRespuesta(id));
    }

    @PostMapping("/respuestas/{id}/aceptar")
    @Operation(summary = "Aceptar (o desaceptar) una respuesta como solución")
    public ApiResponse<RespuestaResponse> aceptarRespuesta(@PathVariable UUID id) {
        return ApiResponse.ok(foroService.aceptarRespuesta(id));
    }
}

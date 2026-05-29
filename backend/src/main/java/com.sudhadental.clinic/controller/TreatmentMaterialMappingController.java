package com.sudhadental.clinic.controller;

import com.sudhadental.clinic.entity.Inventory;
import com.sudhadental.clinic.entity.TreatmentMaterialMapping;
import com.sudhadental.clinic.repository.InventoryRepository;
import com.sudhadental.clinic.repository.TreatmentMaterialMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mappings")
@RequiredArgsConstructor
public class TreatmentMaterialMappingController {

    private final TreatmentMaterialMappingRepository mappingRepository;
    private final InventoryRepository inventoryRepository;

    @GetMapping
    public List<TreatmentMaterialMapping> getAllMappings() {
        return mappingRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createMapping(@RequestBody Map<String, Object> payload) {
        try {
            String procedureName = payload.get("procedureName").toString();
            Long inventoryId = Long.valueOf(payload.get("inventoryId").toString());
            Integer qty = Integer.valueOf(payload.get("quantityRequired").toString());

            Inventory inventoryItem = inventoryRepository.findById(inventoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Inventory item not found"));

            TreatmentMaterialMapping mapping = TreatmentMaterialMapping.builder()
                    .procedureName(procedureName)
                    .inventoryItem(inventoryItem)
                    .quantityRequired(qty)
                    .build();

            return ResponseEntity.ok(mappingRepository.save(mapping));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMapping(@PathVariable Long id) {
        return mappingRepository.findById(id)
                .map(mapping -> {
                    mappingRepository.delete(mapping);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

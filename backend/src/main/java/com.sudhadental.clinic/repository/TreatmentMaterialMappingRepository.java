package com.sudhadental.clinic.repository;

import com.sudhadental.clinic.entity.TreatmentMaterialMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TreatmentMaterialMappingRepository extends JpaRepository<TreatmentMaterialMapping, Long> {
    List<TreatmentMaterialMapping> findByProcedureNameIgnoreCase(String procedureName);
}

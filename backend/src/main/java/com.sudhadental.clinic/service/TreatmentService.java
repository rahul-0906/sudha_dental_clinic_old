package com.sudhadental.clinic.service;

import com.sudhadental.clinic.dto.PrescriptionDto;
import com.sudhadental.clinic.dto.TreatmentRequestDto;
import com.sudhadental.clinic.entity.*;
import com.sudhadental.clinic.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentService {

    private final TreatmentRecordRepository treatmentRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final InventoryRepository inventoryRepository;
    private final TreatmentMaterialMappingRepository treatmentMaterialMappingRepository;
    private final CashLedgerRepository cashLedgerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public TreatmentRecord recordTreatment(TreatmentRequestDto request) {
        log.info("Recording new treatment for patient ID: {}", request.getPatientId());

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + request.getPatientId()));

        User dentist = userRepository.findById(request.getDentistId())
                .orElseThrow(() -> new IllegalArgumentException("Dentist not found with ID: " + request.getDentistId()));

        // 1. Save Treatment Record
        TreatmentRecord record = TreatmentRecord.builder()
                .patient(patient)
                .dentist(dentist)
                .chiefComplaint(request.getChiefComplaint())
                .diagnosis(request.getDiagnosis())
                .procedureCompleted(request.getProcedureCompleted())
                .cost(request.getCost())
                .build();

        record = treatmentRecordRepository.save(record);
        log.info("TreatmentRecord saved with ID: {}", record.getId());

        // 2. Save Prescriptions if any
        if (request.getPrescriptions() != null && !request.getPrescriptions().isEmpty()) {
            for (PrescriptionDto pDto : request.getPrescriptions()) {
                Prescription prescription = Prescription.builder()
                        .treatmentRecord(record)
                        .medicineName(pDto.getMedicineName())
                        .dosage(pDto.getDosage())
                        .duration(pDto.getDuration())
                        .instructions(pDto.getInstructions())
                        .build();
                prescriptionRepository.save(prescription);
            }
            log.info("Saved {} prescriptions linked to treatment record ID: {}", request.getPrescriptions().size(), record.getId());
        }

        // 3. Dynamic Auto-Deduct Inventory Materials based on mapped database rules
        deductMaterialsForProcedure(request.getProcedureCompleted());

        // 4. Create Invoice
        InvoiceStatus invoiceStatus = InvoiceStatus.UNPAID;
        double paid = request.getPaidAmount() != null ? request.getPaidAmount() : 0.0;
        if (paid >= request.getCost()) {
            invoiceStatus = InvoiceStatus.PAID;
        } else if (paid > 0.0) {
            invoiceStatus = InvoiceStatus.PARTIALLY_PAID;
        }

        Invoice invoice = Invoice.builder()
                .patient(patient)
                .totalAmount(request.getCost())
                .paidAmount(paid)
                .status(invoiceStatus)
                .build();
        invoiceRepository.save(invoice);
        log.info("Invoice generated and saved. Total: {}, Paid: {}, Status: {}", request.getCost(), paid, invoiceStatus);

        // 5. Update Cash Ledger if payment is received using Strict Double Entry (Debit increases cash)
        if (paid > 0.0) {
            CashLedger ledgerEntry = CashLedger.builder()
                    .debit(paid)      // Cash inflow
                    .credit(0.0)     // No cash outflow
                    .description("Payment received for treatment record ID: " + record.getId() + " (" + request.getProcedureCompleted() + ")")
                    .build();
            cashLedgerRepository.save(ledgerEntry);
            log.info("Cash ledger updated with Inflow (Debit): {}", paid);
        }

        return record;
    }

    private void deductMaterialsForProcedure(String procedure) {
        if (procedure == null) return;
        
        log.info("Executing dynamic database-driven material auto-deductions for procedure: {}", procedure);
        
        // Query the mappings table dynamically for this specific procedure
        List<TreatmentMaterialMapping> mappings = treatmentMaterialMappingRepository.findByProcedureNameIgnoreCase(procedure.trim());
        
        if (mappings.isEmpty()) {
            log.info("No database mapping rules found for procedure: '{}'. Skipping stock auto-deduction.", procedure);
            return;
        }

        for (TreatmentMaterialMapping mapping : mappings) {
            Inventory item = mapping.getInventoryItem();
            int deductQty = mapping.getQuantityRequired();
            
            int currentQty = item.getQuantity();
            int newQty = Math.max(0, currentQty - deductQty);
            item.setQuantity(newQty);
            inventoryRepository.save(item);
            
            log.info("Deducted {} {} of '{}' dynamically based on procedure mapping. Previous: {}, New: {}", 
                     deductQty, item.getUnit(), item.getMaterialName(), currentQty, newQty);
            
            if (newQty < item.getLowStockThreshold()) {
                log.warn("WARNING: Dynamic stock auto-deduction triggered a critical depletion on '{}' ({} < {}).", 
                         item.getMaterialName(), newQty, item.getLowStockThreshold());
            }
        }
    }
}

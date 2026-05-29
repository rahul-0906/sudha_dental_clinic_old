package com.sudhadental.clinic.config;

import com.sudhadental.clinic.entity.*;
import com.sudhadental.clinic.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final InventoryRepository inventoryRepository;
    private final TreatmentMaterialMappingRepository treatmentMaterialMappingRepository;
    private final AppointmentRepository appointmentRepository;
    private final CashLedgerRepository cashLedgerRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("DatabaseSeeder starting...");

        // 1. Seed Users
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .password("password")
                    .fullName("Dr. Sudha (Owner)")
                    .role(Role.ADMIN)
                    .build();

            User dentist = User.builder()
                    .username("dentist")
                    .password("password")
                    .fullName("Dr. Sarah Jenkins")
                    .role(Role.DENTIST)
                    .build();

            User receptionist = User.builder()
                    .username("receptionist")
                    .password("password")
                    .fullName("Emily Watson")
                    .role(Role.RECEPTIONIST)
                    .build();

            userRepository.saveAll(Arrays.asList(admin, dentist, receptionist));
            log.info("Seeded initial clinic users: admin, dentist, receptionist.");
        }

        // 2. Seed Inventory
        if (inventoryRepository.count() == 0 || !inventoryRepository.findByMaterialNameIgnoreCase("Amoxicillin 500mg").isPresent()) {
            treatmentMaterialMappingRepository.deleteAll();
            inventoryRepository.deleteAll();
            List<Inventory> materials = Arrays.asList(
                    Inventory.builder().materialName("Composite Resin").quantity(15).lowStockThreshold(5).unit("tubes").type("MATERIAL").build(),
                    Inventory.builder().materialName("Dental Anesthetic").quantity(8).lowStockThreshold(10).unit("cartridges").type("MATERIAL").build(),
                    Inventory.builder().materialName("Syringe Needle").quantity(45).lowStockThreshold(15).unit("pcs").type("MATERIAL").build(),
                    Inventory.builder().materialName("Gutta Percha Points").quantity(30).lowStockThreshold(10).unit("pcs").type("MATERIAL").build(),
                    Inventory.builder().materialName("Suture Thread").quantity(4).lowStockThreshold(5).unit("pcs").type("MATERIAL").build(),
                    Inventory.builder().materialName("Prophy Paste").quantity(12).lowStockThreshold(4).unit("tubes").type("MATERIAL").build(),
                    Inventory.builder().materialName("Saliva Ejector").quantity(50).lowStockThreshold(15).unit("pcs").type("MATERIAL").build(),
                    Inventory.builder().materialName("Amoxicillin 500mg").quantity(100).lowStockThreshold(20).unit("tablets").type("MEDICINE").build(),
                    Inventory.builder().materialName("Ibuprofen 400mg").quantity(150).lowStockThreshold(30).unit("tablets").type("MEDICINE").build(),
                    Inventory.builder().materialName("Paracetamol 500mg").quantity(200).lowStockThreshold(45).unit("tablets").type("MEDICINE").build(),
                    Inventory.builder().materialName("Chlorhexidine Mouthwash").quantity(25).lowStockThreshold(8).unit("bottles").type("MEDICINE").build()
            );
            inventoryRepository.saveAll(materials);
            log.info("Seeded initial inventory items (materials and medicines).");
        }

        // 3. Seed Treatment Material Mappings dynamically
        if (treatmentMaterialMappingRepository.count() == 0) {
            // Retrieve inventory items for mappings
            Optional<Inventory> resinOpt = inventoryRepository.findByMaterialNameIgnoreCase("Composite Resin");
            Optional<Inventory> needleOpt = inventoryRepository.findByMaterialNameIgnoreCase("Syringe Needle");
            Optional<Inventory> anestheticOpt = inventoryRepository.findByMaterialNameIgnoreCase("Dental Anesthetic");
            Optional<Inventory> guttaOpt = inventoryRepository.findByMaterialNameIgnoreCase("Gutta Percha Points");
            Optional<Inventory> sutureOpt = inventoryRepository.findByMaterialNameIgnoreCase("Suture Thread");
            Optional<Inventory> pasteOpt = inventoryRepository.findByMaterialNameIgnoreCase("Prophy Paste");
            Optional<Inventory> ejectorOpt = inventoryRepository.findByMaterialNameIgnoreCase("Saliva Ejector");

            if (resinOpt.isPresent() && needleOpt.isPresent()) {
                // "Filling" procedure mappings
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Filling").inventoryItem(resinOpt.get()).quantityRequired(1).build());
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Filling").inventoryItem(needleOpt.get()).quantityRequired(1).build());
            }

            if (guttaOpt.isPresent() && anestheticOpt.isPresent()) {
                // "Root Canal" mappings
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Root Canal").inventoryItem(guttaOpt.get()).quantityRequired(2).build());
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Root Canal").inventoryItem(anestheticOpt.get()).quantityRequired(1).build());
            }

            if (anestheticOpt.isPresent() && sutureOpt.isPresent()) {
                // "Extraction" mappings
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Extraction").inventoryItem(anestheticOpt.get()).quantityRequired(1).build());
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Extraction").inventoryItem(sutureOpt.get()).quantityRequired(2).build());
            }

            if (pasteOpt.isPresent() && ejectorOpt.isPresent()) {
                // "Teeth Cleaning" mappings
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Teeth Cleaning").inventoryItem(pasteOpt.get()).quantityRequired(1).build());
                treatmentMaterialMappingRepository.save(TreatmentMaterialMapping.builder().procedureName("Teeth Cleaning").inventoryItem(ejectorOpt.get()).quantityRequired(1).build());
            }

            log.info("Seeded dynamic clinical Treatment-Material procedure mappings.");
        }

        // 4. Seed Patients and Appointments
        if (patientRepository.count() == 0) {
            Patient p1 = Patient.builder().name("John Doe").phone("9876543210").email("john.doe@example.com").age(35).gender("Male").medicalHistory("Hypertension").build();
            Patient p2 = Patient.builder().name("Jane Smith").phone("9876543211").email("jane.smith@example.com").age(28).gender("Female").medicalHistory("None").build();
            Patient p3 = Patient.builder().name("Alice Johnson").phone("9876543212").email("alice.j@example.com").age(42).gender("Female").medicalHistory("Penicillin Allergy").build();
            patientRepository.saveAll(Arrays.asList(p1, p2, p3));
            log.info("Seeded initial mock patient profiles.");

            List<User> dentists = userRepository.findByRole(Role.DENTIST);
            if (!dentists.isEmpty()) {
                User doc = dentists.get(0);
                
                // Seed mock appointments
                Appointment a1 = Appointment.builder()
                        .patient(p1)
                        .dentist(doc)
                        .appointmentTime(LocalDateTime.now().withHour(10).withMinute(0))
                        .status(AppointmentStatus.CONFIRMED)
                        .chiefComplaint("Toothache in upper molar")
                        .whatsappReminderSent(true)
                        .build();

                Appointment a2 = Appointment.builder()
                        .patient(p2)
                        .dentist(doc)
                        .appointmentTime(LocalDateTime.now().withHour(14).withMinute(30))
                        .status(AppointmentStatus.PENDING)
                        .chiefComplaint("Routine dental cleanup")
                        .whatsappReminderSent(false)
                        .build();

                Appointment a3 = Appointment.builder()
                        .patient(p3)
                        .dentist(doc)
                        .appointmentTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0))
                        .status(AppointmentStatus.PENDING)
                        .chiefComplaint("Root canal follow-up")
                        .whatsappReminderSent(false)
                        .build();

                appointmentRepository.saveAll(Arrays.asList(a1, a2, a3));
                log.info("Seeded initial mock appointments.");
            }
            
            // Seed Double-Entry CashLedger entries (debit=inflow, credit=outflow)
            CashLedger led1 = CashLedger.builder().debit(0.0).credit(250.0).description("Office supplies & cleaning kits purchase").build();
            CashLedger led2 = CashLedger.builder().debit(500.0).credit(0.0).description("Opening balance / Consultation fees").build();
            cashLedgerRepository.saveAll(Arrays.asList(led1, led2));
            log.info("Seeded initial double-entry ledger inflow/outflow entries.");
        }

        log.info("DatabaseSeeder execution finished successfully.");
    }
}

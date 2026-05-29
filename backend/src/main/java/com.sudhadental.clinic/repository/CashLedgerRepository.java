package com.sudhadental.clinic.repository;

import com.sudhadental.clinic.entity.CashLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface CashLedgerRepository extends JpaRepository<CashLedger, Long> {
    List<CashLedger> findByCreatedDateBetween(LocalDateTime start, LocalDateTime end);
}

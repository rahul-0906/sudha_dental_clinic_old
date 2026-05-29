package com.sudhadental.clinic.controller;

import com.sudhadental.clinic.entity.CashLedger;
import com.sudhadental.clinic.entity.Invoice;
import com.sudhadental.clinic.entity.InvoiceStatus;
import com.sudhadental.clinic.repository.CashLedgerRepository;
import com.sudhadental.clinic.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final InvoiceRepository invoiceRepository;
    private final CashLedgerRepository cashLedgerRepository;

    @GetMapping("/invoices")
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @GetMapping("/ledger")
    public List<CashLedger> getLedger() {
        return cashLedgerRepository.findAll();
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getCashFlowSummary() {
        List<CashLedger> entries = cashLedgerRepository.findAll();
        
        // Dynamic summary of double-entry ledger book (Debit = Inflow, Credit = Outflow)
        double totalInflow = entries.stream()
                .mapToDouble(e -> e.getDebit() != null ? e.getDebit() : 0.0)
                .sum();
        double totalOutflow = entries.stream()
                .mapToDouble(e -> e.getCredit() != null ? e.getCredit() : 0.0)
                .sum();

        return ResponseEntity.ok(Map.of(
                "totalInflow", totalInflow,
                "totalOutflow", totalOutflow,
                "netCashFlow", totalInflow - totalOutflow
        ));
    }

    @PostMapping("/ledger")
    public CashLedger addLedgerEntry(@RequestBody Map<String, Object> payload) {
        double amount = Double.parseDouble(payload.get("amount").toString());
        String type = payload.get("type").toString(); // "INFLOW" or "OUTFLOW"
        String desc = payload.get("description").toString();

        CashLedger entry = CashLedger.builder()
                .debit(type.equalsIgnoreCase("INFLOW") ? amount : 0.0)
                .credit(type.equalsIgnoreCase("OUTFLOW") ? amount : 0.0)
                .description(desc)
                .build();
                
        return cashLedgerRepository.save(entry);
    }

    @PostMapping("/invoices/{id}/pay")
    public ResponseEntity<?> payInvoice(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    double payment = payload.get("amount");
                    double newPaidAmount = invoice.getPaidAmount() + payment;
                    invoice.setPaidAmount(newPaidAmount);

                    if (newPaidAmount >= invoice.getTotalAmount()) {
                        invoice.setStatus(InvoiceStatus.PAID);
                    } else {
                        invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
                    }
                    invoiceRepository.save(invoice);

                    // Add inflow entry to general ledger (Debit Cash increases cash balance)
                    CashLedger ledgerEntry = CashLedger.builder()
                            .debit(payment)
                            .credit(0.0)
                            .description("Invoice payment received for Invoice ID: " + invoice.getId())
                            .build();
                    cashLedgerRepository.save(ledgerEntry);

                    return ResponseEntity.ok(invoice);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

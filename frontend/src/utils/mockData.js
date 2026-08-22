export const MOCK_INVOICES = [
  {
    "id": "INV-2026-001",
    "invoice_number": "INV-2026-001",
    "customer_name": "Acme Logistics Ltd",
    "customer_email": "billing@acmelogisticsltd.com",
    "invoice_type": "receivable",
    "amount": 154845.75,
    "status": "created",
    "due_date": "2026-08-24",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-002",
    "invoice_number": "INV-2026-002",
    "customer_name": "Globex Inc",
    "customer_email": "billing@globexinc.com",
    "invoice_type": "receivable",
    "amount": 99002.01,
    "status": "due_soon",
    "due_date": "2026-08-25",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-003",
    "invoice_number": "INV-2026-003",
    "customer_name": "Initech Systems",
    "customer_email": "billing@initechsystems.com",
    "invoice_type": "receivable",
    "amount": 292237.56,
    "status": "overdue",
    "due_date": "2026-08-21",
    "touch_count": 2,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-004",
    "invoice_number": "INV-2026-004",
    "customer_name": "Soylent Corp",
    "customer_email": "billing@soylentcorp.com",
    "invoice_type": "payable",
    "amount": 424232.63,
    "status": "promise_made",
    "due_date": "2026-08-14",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of \u20b9424,232.63 for INV-2026-004 by 2026-08-19.",
    "promises": [
      {
        "id": "promise_demo_4",
        "invoice_id": "INV-2026-004",
        "promised_date": "2026-08-19",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9424,232.63 for INV-2026-004 by 2026-08-19.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-005",
    "invoice_number": "INV-2026-005",
    "customer_name": "Massive Dynamic",
    "customer_email": "billing@massivedynamic.com",
    "invoice_type": "receivable",
    "amount": 264119.96,
    "status": "promise_due",
    "due_date": "2026-08-03",
    "touch_count": 2,
    "extracted_text": "We will transfer payment of \u20b9264,119.96 for INV-2026-005 by 2026-08-08.",
    "promises": [
      {
        "id": "promise_demo_5",
        "invoice_id": "INV-2026-005",
        "promised_date": "2026-08-08",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9264,119.96 for INV-2026-005 by 2026-08-08.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-006",
    "invoice_number": "INV-2026-006",
    "customer_name": "Apex Software Labs",
    "customer_email": "billing@apexsoftwarelabs.com",
    "invoice_type": "receivable",
    "amount": 94471.07,
    "status": "pending_verification",
    "due_date": "2026-08-20",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-007",
    "invoice_number": "INV-2026-007",
    "customer_name": "Hooli Technologies",
    "customer_email": "billing@hoolitechnologies.com",
    "invoice_type": "receivable",
    "amount": 285244.77,
    "status": "escalated",
    "due_date": "2026-08-01",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-008",
    "invoice_number": "INV-2026-008",
    "customer_name": "Pied Piper Cloud",
    "customer_email": "billing@piedpipercloud.com",
    "invoice_type": "payable",
    "amount": 109875.54,
    "status": "paid",
    "due_date": "2026-08-19",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-009",
    "invoice_number": "INV-2026-009",
    "customer_name": "Wayne Enterprises",
    "customer_email": "billing@wayneenterprises.com",
    "invoice_type": "receivable",
    "amount": 27504.88,
    "status": "created",
    "due_date": "2026-08-15",
    "touch_count": 2,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-010",
    "invoice_number": "INV-2026-010",
    "customer_name": "Stark Industries India",
    "customer_email": "billing@starkindustriesindia.com",
    "invoice_type": "receivable",
    "amount": 79441.13,
    "status": "due_soon",
    "due_date": "2026-08-10",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-011",
    "invoice_number": "INV-2026-011",
    "customer_name": "Cyberdyne Systems",
    "customer_email": "billing@cyberdynesystems.com",
    "invoice_type": "receivable",
    "amount": 316037.29,
    "status": "overdue",
    "due_date": "2026-08-13",
    "touch_count": 2,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-012",
    "invoice_number": "INV-2026-012",
    "customer_name": "Umbrella Corp Labs",
    "customer_email": "billing@umbrellacorplabs.com",
    "invoice_type": "payable",
    "amount": 193808.5,
    "status": "promise_made",
    "due_date": "2026-08-27",
    "touch_count": 3,
    "extracted_text": "We will transfer payment of \u20b9193,808.50 for INV-2026-012 by 2026-08-28.",
    "promises": [
      {
        "id": "promise_demo_12",
        "invoice_id": "INV-2026-012",
        "promised_date": "2026-08-28",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9193,808.50 for INV-2026-012 by 2026-08-28.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-013",
    "invoice_number": "INV-2026-013",
    "customer_name": "Tyrell BioTech",
    "customer_email": "billing@tyrellbiotech.com",
    "invoice_type": "receivable",
    "amount": 54489.01,
    "status": "promise_due",
    "due_date": "2026-08-14",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of \u20b954,489.01 for INV-2026-013 by 2026-08-19.",
    "promises": [
      {
        "id": "promise_demo_13",
        "invoice_id": "INV-2026-013",
        "promised_date": "2026-08-19",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b954,489.01 for INV-2026-013 by 2026-08-19.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-014",
    "invoice_number": "INV-2026-014",
    "customer_name": "Oscorp Tech",
    "customer_email": "billing@oscorptech.com",
    "invoice_type": "receivable",
    "amount": 118594.12,
    "status": "pending_verification",
    "due_date": "2026-08-08",
    "touch_count": 2,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-015",
    "invoice_number": "INV-2026-015",
    "customer_name": "LexCorp Finance",
    "customer_email": "billing@lexcorpfinance.com",
    "invoice_type": "receivable",
    "amount": 19293.27,
    "status": "escalated",
    "due_date": "2026-08-11",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-016",
    "invoice_number": "INV-2026-016",
    "customer_name": "Sterling Cooper B2B",
    "customer_email": "billing@sterlingcooperb2b.com",
    "invoice_type": "payable",
    "amount": 371522.56,
    "status": "paid",
    "due_date": "2026-08-05",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-017",
    "invoice_number": "INV-2026-017",
    "customer_name": "Bluth Development",
    "customer_email": "billing@bluthdevelopment.com",
    "invoice_type": "receivable",
    "amount": 316707.34,
    "status": "created",
    "due_date": "2026-08-26",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-018",
    "invoice_number": "INV-2026-018",
    "customer_name": "Dunder Mifflin Paper Co",
    "customer_email": "billing@dundermifflinpaperco.com",
    "invoice_type": "receivable",
    "amount": 57598.21,
    "status": "due_soon",
    "due_date": "2026-08-04",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-019",
    "invoice_number": "INV-2026-019",
    "customer_name": "Prestige Worldwide",
    "customer_email": "billing@prestigeworldwide.com",
    "invoice_type": "receivable",
    "amount": 203244.66,
    "status": "overdue",
    "due_date": "2026-08-11",
    "touch_count": 2,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-020",
    "invoice_number": "INV-2026-020",
    "customer_name": "Vandelay Industries",
    "customer_email": "billing@vandelayindustries.com",
    "invoice_type": "payable",
    "amount": 286895.76,
    "status": "promise_made",
    "due_date": "2026-08-27",
    "touch_count": 0,
    "extracted_text": "We will transfer payment of \u20b9286,895.76 for INV-2026-020 by 2026-08-28.",
    "promises": [
      {
        "id": "promise_demo_20",
        "invoice_id": "INV-2026-020",
        "promised_date": "2026-08-28",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9286,895.76 for INV-2026-020 by 2026-08-28.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-021",
    "invoice_number": "INV-2026-021",
    "customer_name": "Wonka Tech Solutions",
    "customer_email": "billing@wonkatechsolutions.com",
    "invoice_type": "receivable",
    "amount": 55989.81,
    "status": "promise_due",
    "due_date": "2026-08-20",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of \u20b955,989.81 for INV-2026-021 by 2026-08-25.",
    "promises": [
      {
        "id": "promise_demo_21",
        "invoice_id": "INV-2026-021",
        "promised_date": "2026-08-25",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b955,989.81 for INV-2026-021 by 2026-08-25.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-022",
    "invoice_number": "INV-2026-022",
    "customer_name": "Brawndo Energy Inc",
    "customer_email": "billing@brawndoenergyinc.com",
    "invoice_type": "receivable",
    "amount": 320187.11,
    "status": "pending_verification",
    "due_date": "2026-08-20",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-023",
    "invoice_number": "INV-2026-023",
    "customer_name": "Gekko & Co Capital",
    "customer_email": "billing@gekkococapital.com",
    "invoice_type": "receivable",
    "amount": 141722.69,
    "status": "escalated",
    "due_date": "2026-08-27",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-024",
    "invoice_number": "INV-2026-024",
    "customer_name": "E Corp Digital",
    "customer_email": "billing@ecorpdigital.com",
    "invoice_type": "payable",
    "amount": 123594.67,
    "status": "paid",
    "due_date": "2026-08-04",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-025",
    "invoice_number": "INV-2026-025",
    "customer_name": "Allsafe Cybersecurity",
    "customer_email": "billing@allsafecybersecurity.com",
    "invoice_type": "receivable",
    "amount": 428426.27,
    "status": "created",
    "due_date": "2026-08-08",
    "touch_count": 2,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-026",
    "invoice_number": "INV-2026-026",
    "customer_name": "Evil Corp Logistics",
    "customer_email": "billing@evilcorplogistics.com",
    "invoice_type": "receivable",
    "amount": 110891.89,
    "status": "due_soon",
    "due_date": "2026-08-11",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-027",
    "invoice_number": "INV-2026-027",
    "customer_name": "Virtucon Global",
    "customer_email": "billing@virtuconglobal.com",
    "invoice_type": "receivable",
    "amount": 125578.96,
    "status": "overdue",
    "due_date": "2026-08-21",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-028",
    "invoice_number": "INV-2026-028",
    "customer_name": "Rekall Inc",
    "customer_email": "billing@rekallinc.com",
    "invoice_type": "payable",
    "amount": 189479.26,
    "status": "promise_made",
    "due_date": "2026-08-05",
    "touch_count": 2,
    "extracted_text": "We will transfer payment of \u20b9189,479.26 for INV-2026-028 by 2026-08-10.",
    "promises": [
      {
        "id": "promise_demo_28",
        "invoice_id": "INV-2026-028",
        "promised_date": "2026-08-10",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9189,479.26 for INV-2026-028 by 2026-08-10.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-029",
    "invoice_number": "INV-2026-029",
    "customer_name": "Buy n Large Commerce",
    "customer_email": "billing@buynlargecommerce.com",
    "invoice_type": "receivable",
    "amount": 328667.14,
    "status": "promise_due",
    "due_date": "2026-08-04",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of \u20b9328,667.14 for INV-2026-029 by 2026-08-09.",
    "promises": [
      {
        "id": "promise_demo_29",
        "invoice_id": "INV-2026-029",
        "promised_date": "2026-08-09",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9328,667.14 for INV-2026-029 by 2026-08-09.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-030",
    "invoice_number": "INV-2026-030",
    "customer_name": "Nakamoto Blockchain",
    "customer_email": "billing@nakamotoblockchain.com",
    "invoice_type": "receivable",
    "amount": 449706.57,
    "status": "pending_verification",
    "due_date": "2026-08-04",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-031",
    "invoice_number": "INV-2026-031",
    "customer_name": "Zomato Enterprise",
    "customer_email": "billing@zomatoenterprise.com",
    "invoice_type": "receivable",
    "amount": 442121.45,
    "status": "escalated",
    "due_date": "2026-08-23",
    "touch_count": 2,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-032",
    "invoice_number": "INV-2026-032",
    "customer_name": "Swiggy Cloud Kitchens",
    "customer_email": "billing@swiggycloudkitchens.com",
    "invoice_type": "payable",
    "amount": 181423.63,
    "status": "paid",
    "due_date": "2026-08-28",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-033",
    "invoice_number": "INV-2026-033",
    "customer_name": "Razorpay Merchant Services",
    "customer_email": "billing@razorpaymerchantservices.com",
    "invoice_type": "receivable",
    "amount": 361332.83,
    "status": "created",
    "due_date": "2026-08-25",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-034",
    "invoice_number": "INV-2026-034",
    "customer_name": "Paytm Business Tech",
    "customer_email": "billing@paytmbusinesstech.com",
    "invoice_type": "receivable",
    "amount": 418373.12,
    "status": "due_soon",
    "due_date": "2026-08-15",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-035",
    "invoice_number": "INV-2026-035",
    "customer_name": "PhonePe Financials",
    "customer_email": "billing@phonepefinancials.com",
    "invoice_type": "receivable",
    "amount": 56601.32,
    "status": "overdue",
    "due_date": "2026-08-19",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-036",
    "invoice_number": "INV-2026-036",
    "customer_name": "Flipkart Logistics",
    "customer_email": "billing@flipkartlogistics.com",
    "invoice_type": "payable",
    "amount": 133586.75,
    "status": "promise_made",
    "due_date": "2026-08-28",
    "touch_count": 0,
    "extracted_text": "We will transfer payment of \u20b9133,586.75 for INV-2026-036 by 2026-08-28.",
    "promises": [
      {
        "id": "promise_demo_36",
        "invoice_id": "INV-2026-036",
        "promised_date": "2026-08-28",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9133,586.75 for INV-2026-036 by 2026-08-28.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-037",
    "invoice_number": "INV-2026-037",
    "customer_name": "Meesho Supplier Hub",
    "customer_email": "billing@meeshosupplierhub.com",
    "invoice_type": "receivable",
    "amount": 384337.44,
    "status": "promise_due",
    "due_date": "2026-08-21",
    "touch_count": 3,
    "extracted_text": "We will transfer payment of \u20b9384,337.44 for INV-2026-037 by 2026-08-26.",
    "promises": [
      {
        "id": "promise_demo_37",
        "invoice_id": "INV-2026-037",
        "promised_date": "2026-08-26",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9384,337.44 for INV-2026-037 by 2026-08-26.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-038",
    "invoice_number": "INV-2026-038",
    "customer_name": "Blinkit Fresh Supplies",
    "customer_email": "billing@blinkitfreshsupplies.com",
    "invoice_type": "receivable",
    "amount": 206379.72,
    "status": "pending_verification",
    "due_date": "2026-08-18",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-039",
    "invoice_number": "INV-2026-039",
    "customer_name": "Zepto Quick Commerce",
    "customer_email": "billing@zeptoquickcommerce.com",
    "invoice_type": "receivable",
    "amount": 295906.89,
    "status": "escalated",
    "due_date": "2026-08-18",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-040",
    "invoice_number": "INV-2026-040",
    "customer_name": "Dunzo Hyperlocal",
    "customer_email": "billing@dunzohyperlocal.com",
    "invoice_type": "payable",
    "amount": 91643.35,
    "status": "paid",
    "due_date": "2026-08-01",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-041",
    "invoice_number": "INV-2026-041",
    "customer_name": "Ola Fleet Operations",
    "customer_email": "billing@olafleetoperations.com",
    "invoice_type": "receivable",
    "amount": 72766.12,
    "status": "created",
    "due_date": "2026-08-06",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-042",
    "invoice_number": "INV-2026-042",
    "customer_name": "Uber Freight Tech",
    "customer_email": "billing@uberfreighttech.com",
    "invoice_type": "receivable",
    "amount": 362161.79,
    "status": "due_soon",
    "due_date": "2026-08-02",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-043",
    "invoice_number": "INV-2026-043",
    "customer_name": "Porter Logistics India",
    "customer_email": "billing@porterlogisticsindia.com",
    "invoice_type": "receivable",
    "amount": 418060.54,
    "status": "overdue",
    "due_date": "2026-08-09",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-044",
    "invoice_number": "INV-2026-044",
    "customer_name": "Delhivery Express",
    "customer_email": "billing@delhiveryexpress.com",
    "invoice_type": "payable",
    "amount": 252256.23,
    "status": "promise_made",
    "due_date": "2026-08-14",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of \u20b9252,256.23 for INV-2026-044 by 2026-08-19.",
    "promises": [
      {
        "id": "promise_demo_44",
        "invoice_id": "INV-2026-044",
        "promised_date": "2026-08-19",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9252,256.23 for INV-2026-044 by 2026-08-19.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-045",
    "invoice_number": "INV-2026-045",
    "customer_name": "Blue Dart Cargo",
    "customer_email": "billing@bluedartcargo.com",
    "invoice_type": "receivable",
    "amount": 376772.54,
    "status": "promise_due",
    "due_date": "2026-08-12",
    "touch_count": 3,
    "extracted_text": "We will transfer payment of \u20b9376,772.54 for INV-2026-045 by 2026-08-17.",
    "promises": [
      {
        "id": "promise_demo_45",
        "invoice_id": "INV-2026-045",
        "promised_date": "2026-08-17",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of \u20b9376,772.54 for INV-2026-045 by 2026-08-17.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-2026-046",
    "invoice_number": "INV-2026-046",
    "customer_name": "Shadowfax Tech",
    "customer_email": "billing@shadowfaxtech.com",
    "invoice_type": "receivable",
    "amount": 122168.79,
    "status": "pending_verification",
    "due_date": "2026-08-02",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-047",
    "invoice_number": "INV-2026-047",
    "customer_name": "Xpressbees Supply",
    "customer_email": "billing@xpressbeessupply.com",
    "invoice_type": "receivable",
    "amount": 438490.26,
    "status": "escalated",
    "due_date": "2026-08-07",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-048",
    "invoice_number": "INV-2026-048",
    "customer_name": "Shiprocket Commerce",
    "customer_email": "billing@shiprocketcommerce.com",
    "invoice_type": "payable",
    "amount": 58393.26,
    "status": "paid",
    "due_date": "2026-08-06",
    "touch_count": 3,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-049",
    "invoice_number": "INV-2026-049",
    "customer_name": "LogiNext Solutions",
    "customer_email": "billing@loginextsolutions.com",
    "invoice_type": "receivable",
    "amount": 332771.63,
    "status": "created",
    "due_date": "2026-08-10",
    "touch_count": 0,
    "extracted_text": null,
    "promises": []
  },
  {
    "id": "INV-2026-050",
    "invoice_number": "INV-2026-050",
    "customer_name": "Locus AI Logistics",
    "customer_email": "billing@locusailogistics.com",
    "invoice_type": "receivable",
    "amount": 187393.63,
    "status": "due_soon",
    "due_date": "2026-08-13",
    "touch_count": 1,
    "extracted_text": null,
    "promises": []
  }
];

export const MOCK_METRICS = { total_invoices_count: 50, recovery_rate_percentage: 42.5 };

export const MOCK_INVOICES = [
  {
    "id": "INV-1001",
    "invoice_number": "INV-1001",
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
    "id": "INV-1002",
    "invoice_number": "INV-1002",
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
    "id": "INV-1003",
    "invoice_number": "INV-1003",
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
    "id": "INV-1004",
    "invoice_number": "INV-1004",
    "customer_name": "Soylent Corp",
    "customer_email": "billing@soylentcorp.com",
    "invoice_type": "payable",
    "amount": 424232.63,
    "status": "promise_made",
    "due_date": "2026-08-14",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of ₹424,232.63 for INV-1004 by 2026-08-19.",
    "promises": [
      {
        "id": "promise_demo_4",
        "invoice_id": "INV-1004",
        "promised_date": "2026-08-19",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹424,232.63 for INV-1004 by 2026-08-19.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1005",
    "invoice_number": "INV-1005",
    "customer_name": "Massive Dynamic",
    "customer_email": "billing@massivedynamic.com",
    "invoice_type": "receivable",
    "amount": 264119.96,
    "status": "promise_due",
    "due_date": "2026-08-03",
    "touch_count": 2,
    "extracted_text": "We will transfer payment of ₹264,119.96 for INV-1005 by 2026-08-08.",
    "promises": [
      {
        "id": "promise_demo_5",
        "invoice_id": "INV-1005",
        "promised_date": "2026-08-08",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹264,119.96 for INV-1005 by 2026-08-08.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1006",
    "invoice_number": "INV-1006",
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
    "id": "INV-1007",
    "invoice_number": "INV-1007",
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
    "id": "INV-1008",
    "invoice_number": "INV-1008",
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
    "id": "INV-1009",
    "invoice_number": "INV-1009",
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
    "id": "INV-1010",
    "invoice_number": "INV-1010",
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
    "id": "INV-1011",
    "invoice_number": "INV-1011",
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
    "id": "INV-1012",
    "invoice_number": "INV-1012",
    "customer_name": "Umbrella Corp Labs",
    "customer_email": "billing@umbrellacorplabs.com",
    "invoice_type": "payable",
    "amount": 193808.5,
    "status": "promise_made",
    "due_date": "2026-08-27",
    "touch_count": 3,
    "extracted_text": "We will transfer payment of ₹193,808.50 for INV-1012 by 2026-08-28.",
    "promises": [
      {
        "id": "promise_demo_12",
        "invoice_id": "INV-1012",
        "promised_date": "2026-08-28",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹193,808.50 for INV-1012 by 2026-08-28.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1013",
    "invoice_number": "INV-1013",
    "customer_name": "Tyrell BioTech",
    "customer_email": "billing@tyrellbiotech.com",
    "invoice_type": "receivable",
    "amount": 54489.01,
    "status": "promise_due",
    "due_date": "2026-08-14",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of ₹54,489.01 for INV-1013 by 2026-08-19.",
    "promises": [
      {
        "id": "promise_demo_13",
        "invoice_id": "INV-1013",
        "promised_date": "2026-08-19",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹54,489.01 for INV-1013 by 2026-08-19.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1014",
    "invoice_number": "INV-1014",
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
    "id": "INV-1015",
    "invoice_number": "INV-1015",
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
    "id": "INV-1016",
    "invoice_number": "INV-1016",
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
    "id": "INV-1017",
    "invoice_number": "INV-1017",
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
    "id": "INV-1018",
    "invoice_number": "INV-1018",
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
    "id": "INV-1019",
    "invoice_number": "INV-1019",
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
    "id": "INV-1020",
    "invoice_number": "INV-1020",
    "customer_name": "Vandelay Industries",
    "customer_email": "billing@vandelayindustries.com",
    "invoice_type": "payable",
    "amount": 286895.76,
    "status": "overdue",
    "due_date": "2026-08-27",
    "touch_count": 0,
    "extracted_text": "Working on cash flow, will try to clear the dues soon.",
    "promises": [
      {
        "id": "promise_demo_20",
        "invoice_id": "INV-1020",
        "promised_date": null,
        "confidence_score": 0.52,
        "source_text": "Working on cash flow, will try to clear the dues soon.",
        "status": "flagged_human_review"
      }
    ]
  },
  {
    "id": "INV-1021",
    "invoice_number": "INV-1021",
    "customer_name": "Wonka Tech Solutions",
    "customer_email": "billing@wonkatechsolutions.com",
    "invoice_type": "receivable",
    "amount": 55989.81,
    "status": "promise_due",
    "due_date": "2026-08-20",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of ₹55,989.81 for INV-1021 by 2026-08-25.",
    "promises": [
      {
        "id": "promise_demo_21",
        "invoice_id": "INV-1021",
        "promised_date": "2026-08-25",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹55,989.81 for INV-1021 by 2026-08-25.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1022",
    "invoice_number": "INV-1022",
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
    "id": "INV-1023",
    "invoice_number": "INV-1023",
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
    "id": "INV-1024",
    "invoice_number": "INV-1024",
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
    "id": "INV-1025",
    "invoice_number": "INV-1025",
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
    "id": "INV-1026",
    "invoice_number": "INV-1026",
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
    "id": "INV-1027",
    "invoice_number": "INV-1027",
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
    "id": "INV-1028",
    "invoice_number": "INV-1028",
    "customer_name": "Rekall Inc",
    "customer_email": "billing@rekallinc.com",
    "invoice_type": "payable",
    "amount": 189479.26,
    "status": "promise_made",
    "due_date": "2026-08-05",
    "touch_count": 2,
    "extracted_text": "We will transfer payment of ₹189,479.26 for INV-1028 by 2026-08-10.",
    "promises": [
      {
        "id": "promise_demo_28",
        "invoice_id": "INV-1028",
        "promised_date": "2026-08-10",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹189,479.26 for INV-1028 by 2026-08-10.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1029",
    "invoice_number": "INV-1029",
    "customer_name": "Buy n Large Commerce",
    "customer_email": "billing@buynlargecommerce.com",
    "invoice_type": "receivable",
    "amount": 328667.14,
    "status": "promise_due",
    "due_date": "2026-08-04",
    "touch_count": 1,
    "extracted_text": "We will transfer payment of ₹328,667.14 for INV-1029 by 2026-08-09.",
    "promises": [
      {
        "id": "promise_demo_29",
        "invoice_id": "INV-1029",
        "promised_date": "2026-08-09",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹328,667.14 for INV-1029 by 2026-08-09.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1030",
    "invoice_number": "INV-1030",
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
    "id": "INV-1031",
    "invoice_number": "INV-1031",
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
    "id": "INV-1032",
    "invoice_number": "INV-1032",
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
    "id": "INV-1033",
    "invoice_number": "INV-1033",
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
    "id": "INV-1034",
    "invoice_number": "INV-1034",
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
    "id": "INV-1035",
    "invoice_number": "INV-1035",
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
    "id": "INV-1036",
    "invoice_number": "INV-1036",
    "customer_name": "Flipkart Logistics",
    "customer_email": "billing@flipkartlogistics.com",
    "invoice_type": "payable",
    "amount": 133586.75,
    "status": "overdue",
    "due_date": "2026-08-28",
    "touch_count": 0,
    "extracted_text": "Working on cash flow, will try to clear the dues soon.",
    "promises": [
      {
        "id": "promise_demo_36",
        "invoice_id": "INV-1036",
        "promised_date": null,
        "confidence_score": 0.52,
        "source_text": "Working on cash flow, will try to clear the dues soon.",
        "status": "flagged_human_review"
      }
    ]
  },
  {
    "id": "INV-1037",
    "invoice_number": "INV-1037",
    "customer_name": "Meesho Supplier Hub",
    "customer_email": "billing@meeshosupplierhub.com",
    "invoice_type": "receivable",
    "amount": 384337.44,
    "status": "promise_due",
    "due_date": "2026-08-21",
    "touch_count": 3,
    "extracted_text": "We will transfer payment of ₹384,337.44 for INV-1037 by 2026-08-26.",
    "promises": [
      {
        "id": "promise_demo_37",
        "invoice_id": "INV-1037",
        "promised_date": "2026-08-26",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹384,337.44 for INV-1037 by 2026-08-26.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1038",
    "invoice_number": "INV-1038",
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
    "id": "INV-1039",
    "invoice_number": "INV-1039",
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
    "id": "INV-1040",
    "invoice_number": "INV-1040",
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
    "id": "INV-1041",
    "invoice_number": "INV-1041",
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
    "id": "INV-1042",
    "invoice_number": "INV-1042",
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
    "id": "INV-1043",
    "invoice_number": "INV-1043",
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
    "id": "INV-1044",
    "invoice_number": "INV-1044",
    "customer_name": "Delhivery Express",
    "customer_email": "billing@delhiveryexpress.com",
    "invoice_type": "payable",
    "amount": 252256.23,
    "status": "overdue",
    "due_date": "2026-08-14",
    "touch_count": 1,
    "extracted_text": "Working on cash flow, will try to clear the dues soon.",
    "promises": [
      {
        "id": "promise_demo_44",
        "invoice_id": "INV-1044",
        "promised_date": null,
        "confidence_score": 0.52,
        "source_text": "Working on cash flow, will try to clear the dues soon.",
        "status": "flagged_human_review"
      }
    ]
  },
  {
    "id": "INV-1045",
    "invoice_number": "INV-1045",
    "customer_name": "Blue Dart Cargo",
    "customer_email": "billing@bluedartcargo.com",
    "invoice_type": "receivable",
    "amount": 376772.54,
    "status": "promise_due",
    "due_date": "2026-08-12",
    "touch_count": 3,
    "extracted_text": "We will transfer payment of ₹376,772.54 for INV-1045 by 2026-08-17.",
    "promises": [
      {
        "id": "promise_demo_45",
        "invoice_id": "INV-1045",
        "promised_date": "2026-08-17",
        "confidence_score": 0.95,
        "source_text": "We will transfer payment of ₹376,772.54 for INV-1045 by 2026-08-17.",
        "status": "active"
      }
    ]
  },
  {
    "id": "INV-1046",
    "invoice_number": "INV-1046",
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
    "id": "INV-1047",
    "invoice_number": "INV-1047",
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
    "id": "INV-1048",
    "invoice_number": "INV-1048",
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
    "id": "INV-1049",
    "invoice_number": "INV-1049",
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
    "id": "INV-1050",
    "invoice_number": "INV-1050",
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

// ---------------------------------------------------------------------------
// Demo-mode fixtures.
//
// Everything below is derived from MOCK_INVOICES above, so Demo Mode stays
// internally consistent: the dashboard cards, the audit trail and the recovery
// sweep all describe the same set of invoices. No standalone hand-typed totals.
// ---------------------------------------------------------------------------

export const MOCK_SETTINGS = {
  max_touches_per_invoice: 3,
  cooldown_days_between_touches: 4,
  promise_confidence_threshold: 0.7
};

const DAY_MS = 86400000;

function atDays(invoice, daysBeforeDue) {
  const due = new Date(`${invoice.due_date}T09:15:00Z`).getTime();
  return new Date(due - daysBeforeDue * DAY_MS).toISOString();
}

function buildAuditLogs() {
  const logs = [];
  let seq = 0;
  let vagueReplies = 0;

  const add = (invoice, daysBeforeDue, fields) => {
    seq += 1;
    logs.push({
      id: `demo_log_${String(seq).padStart(4, '0')}`,
      invoice_id: invoice.id,
      timestamp: atDays(invoice, daysBeforeDue),
      trigger: 'scheduler_tick',
      actor: 'ai',
      rule_that_blocked: null,
      ...fields
    });
  };

  MOCK_INVOICES.forEach((invoice, index) => {
    const money = `₹${Number(invoice.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const promise = invoice.promises && invoice.promises[0];
    const touches = Math.min(invoice.touch_count || 0, MOCK_SETTINGS.max_touches_per_invoice);

    add(invoice, 21, {
      trigger: 'invoice_ingested',
      actor: 'user',
      action_taken: 'invoice_created',
      rule_applied: 'initial_ingestion',
      detail: `Created invoice ${invoice.id} for ${invoice.customer_name} (${money}).`
    });

    // Executed touches, spaced one cooldown window apart.
    for (let t = 1; t <= touches; t += 1) {
      const channel = t >= MOCK_SETTINGS.max_touches_per_invoice ? 'whatsapp' : 'email';
      add(invoice, 13 - t * MOCK_SETTINGS.cooldown_days_between_touches, {
        action_taken: `sent_${channel}`,
        rule_applied: `escalation_ladder_step_${t}`,
        detail: `Sent touch #${t} via ${channel}. Subject: Payment reminder for ${invoice.id}`
      });
    }

    // A held-back decision for every invoice still inside its cooldown window.
    if (touches > 0 && touches < MOCK_SETTINGS.max_touches_per_invoice && invoice.status !== 'paid') {
      const elapsed = 1 + (index % MOCK_SETTINGS.cooldown_days_between_touches);
      add(invoice, 0.5, {
        action_taken: 'no_op',
        rule_applied: 'cooldown_enforcement',
        rule_that_blocked: 'cooldown_active',
        detail: `Cooldown active (${elapsed.toFixed(1)}/${MOCK_SETTINGS.cooldown_days_between_touches} days elapsed since last touch).`
      });
    }

    // Low-confidence extraction: the promise is parked for a human, and the
    // invoice stays where it was until somebody approves it.
    if (promise && promise.status === 'flagged_human_review') {
      add(invoice, 4, {
        trigger: 'customer_reply',
        action_taken: 'promise_proposed_awaiting_approval',
        rule_applied: 'human_in_the_loop_review',
        detail: `Extracted a possible promise from the customer reply, but confidence was only ${promise.confidence_score.toFixed(2)} (threshold ${MOCK_SETTINGS.promise_confidence_threshold}). Waiting for a human decision.`
      });
    }

    if (invoice.status === 'promise_made' || invoice.status === 'promise_due') {
      const autoAccepted = (promise ? promise.confidence_score : 0) >= MOCK_SETTINGS.promise_confidence_threshold;
      add(invoice, 7, {
        trigger: 'customer_reply',
        action_taken: autoAccepted ? 'auto_accepted_high_confidence' : 'promise_proposed_awaiting_approval',
        rule_applied: autoAccepted ? 'confidence_gate_passed' : 'human_in_the_loop_review',
        detail: `Read the customer reply and extracted a promise to pay by ${promise ? promise.promised_date : 'an unstated date'} (confidence ${(promise ? promise.confidence_score : 0).toFixed(2)}).`
      });
      add(invoice, 6.9, {
        actor: autoAccepted ? 'ai' : 'user',
        action_taken: `status_changed:overdue->${invoice.status}`,
        rule_applied: autoAccepted ? 'confidence_gate_passed' : 'human_approved_promise',
        detail: `Promise recorded for ${promise ? promise.promised_date : 'the agreed date'}.`
      });
    }

    if (invoice.status === 'promise_made') {
      add(invoice, 0.2, {
        action_taken: 'no_op',
        rule_applied: 'active_promise_pause',
        rule_that_blocked: 'active_promise_pause',
        detail: `Promise date ${promise ? promise.promised_date : ''} has not arrived yet, so no touch was sent.`
      });
    }

    if (invoice.status === 'promise_due') {
      add(invoice, 0.4, {
        action_taken: 'promise_broken',
        rule_applied: 'promise_date_passed',
        detail: `Promise date ${promise ? promise.promised_date : ''} passed without payment.`
      });
    }

    if (invoice.status === 'pending_verification') {
      add(invoice, 3, {
        trigger: 'customer_reply',
        action_taken: 'status_changed:overdue->pending_verification',
        rule_applied: 'unverified_payment_claim_pause',
        detail: 'Customer says this invoice is already paid. Holding outbound touches until Razorpay confirms.'
      });
      add(invoice, 0.3, {
        action_taken: 'no_op',
        rule_applied: 'pending_verification_pause',
        rule_that_blocked: 'pending_verification_pause',
        detail: 'Outbound actions paused while the customer payment claim is pending verification.'
      });
    }

    if (invoice.status === 'escalated') {
      add(invoice, 1, {
        action_taken: `status_changed:overdue->escalated`,
        rule_applied: 'max_touches_reached',
        detail: `Invoice hit the maximum touch limit of ${MOCK_SETTINGS.max_touches_per_invoice}. Handed to a human.`
      });
      add(invoice, 0.1, {
        action_taken: 'no_op',
        rule_applied: 'human_handoff_active',
        rule_that_blocked: 'max_touches_reached',
        detail: `Max touches (${MOCK_SETTINGS.max_touches_per_invoice}) reached. Invoice is with a human collections agent.`
      });
    }

    if (invoice.status === 'paid') {
      add(invoice, -(index % 5), {
        trigger: 'razorpay_webhook',
        actor: 'system',
        action_taken: 'status_changed:pending_verification->paid',
        rule_applied: 'verified_payment_resolution',
        detail: `Webhook event 'payment.captured' verified. Payment ID: pay_demo_${invoice.id.replace('INV-', '')}. Invoice marked paid.`
      });
    }

    // Two replies that contained no commitment at all, so nothing was extracted.
    if (invoice.status === 'overdue' && vagueReplies < 2) {
      vagueReplies += 1;
      add(invoice, 2, {
        trigger: 'customer_reply',
        action_taken: 'no_op',
        rule_applied: 'reply_analysis',
        rule_that_blocked: 'no_promise_detected',
        detail: 'Read the customer reply. No payment promise and no payment claim was found.'
      });
    }
  });

  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export const MOCK_AUDIT_LOGS = buildAuditLogs();

const paidInvoices = MOCK_INVOICES.filter((i) => i.status === 'paid');
const sumAmounts = (list) => list.reduce((total, i) => total + Number(i.amount || 0), 0);
const totalAmount = sumAmounts(MOCK_INVOICES);
const recoveredAmount = sumAmounts(paidInvoices);

// Only the four guardrails the metrics contract defines are counted as
// "actions blocked by a guardrail". `no_promise_detected` is still logged and
// still shown in the audit trail, but it is a reading outcome, not a guardrail.
const GUARDRAIL_BLOCK_REASONS = [
  'cooldown_active',
  'max_touches_reached',
  'pending_verification_pause',
  'active_promise_pause'
];

const blockedBreakdown = MOCK_AUDIT_LOGS.reduce((acc, log) => {
  if (!GUARDRAIL_BLOCK_REASONS.includes(log.rule_that_blocked)) return acc;
  acc[log.rule_that_blocked] = (acc[log.rule_that_blocked] || 0) + 1;
  return acc;
}, GUARDRAIL_BLOCK_REASONS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}));

const createdAt = new Map(
  MOCK_AUDIT_LOGS
    .filter((l) => l.action_taken === 'invoice_created')
    .map((l) => [l.invoice_id, l.timestamp])
);
const recoveryDays = MOCK_AUDIT_LOGS
  .filter((l) => l.rule_applied === 'verified_payment_resolution' && createdAt.has(l.invoice_id))
  .map((l) => (new Date(l.timestamp) - new Date(createdAt.get(l.invoice_id))) / DAY_MS);

export const MOCK_METRICS = {
  total_invoices: MOCK_INVOICES.length,
  total_amount: Number(totalAmount.toFixed(2)),
  total_recovered_amount: Number(recoveredAmount.toFixed(2)),
  recovery_rate_percentage: Number(((recoveredAmount / totalAmount) * 100).toFixed(1)),
  avg_days_to_recovery: recoveryDays.length
    ? Number((recoveryDays.reduce((a, b) => a + b, 0) / recoveryDays.length).toFixed(1))
    : 0,
  promises_kept_count: MOCK_AUDIT_LOGS.filter((l) => l.rule_applied === 'verified_payment_resolution').length,
  promises_broken_count: MOCK_AUDIT_LOGS.filter((l) => l.rule_applied === 'promise_date_passed').length,
  human_escalations_count: MOCK_INVOICES.filter((i) => i.status === 'escalated').length,
  paid_invoices_count: paidInvoices.length,
  awaiting_review_count: MOCK_INVOICES.filter((i) =>
    (i.promises || []).some((p) => p.status === 'flagged_human_review')
  ).length,
  actions_blocked_count: Object.values(blockedBreakdown).reduce((a, b) => a + b, 0),
  blocked_breakdown: blockedBreakdown
};

function buildTickResult() {
  const results = [];
  MOCK_INVOICES.forEach((invoice, index) => {
    if (invoice.status === 'paid' || invoice.status === 'written_off') return;
    const touches = invoice.touch_count || 0;

    if (invoice.status === 'pending_verification') {
      results.push({ invoice_id: invoice.id, action: 'no_op', reason: 'pending_verification_pause', touch_number: touches });
    } else if (invoice.status === 'promise_made') {
      results.push({ invoice_id: invoice.id, action: 'no_op', reason: 'active_promise_pause', touch_number: touches });
    } else if (invoice.status === 'escalated' || touches >= MOCK_SETTINGS.max_touches_per_invoice) {
      results.push({ invoice_id: invoice.id, action: 'no_op', reason: 'max_touches_reached', touch_number: touches });
    } else if (touches > 0 && index % 3 !== 0) {
      results.push({ invoice_id: invoice.id, action: 'no_op', reason: 'cooldown_active', touch_number: touches });
    } else {
      const nextTouch = touches + 1;
      results.push({
        invoice_id: invoice.id,
        action: nextTouch >= MOCK_SETTINGS.max_touches_per_invoice ? 'sent_whatsapp' : 'sent_email',
        reason: `escalation_ladder_step_${nextTouch}`,
        touch_number: nextTouch
      });
    }
  });
  return { status: 'success', processed_count: results.length, results };
}

export const MOCK_TICK_RESULT = buildTickResult();

import json
import urllib.request

base = "http://127.0.0.1:8000"

print("1. Testing GET /health...")
with urllib.request.urlopen(f"{base}/health") as res:
    data = json.loads(res.read())
    print("   Health:", data["status"], "| Service:", data["service"])

print("2. Testing GET /zones...")
with urllib.request.urlopen(f"{base}/zones") as res:
    data = json.loads(res.read())
    print(f"   Zones found: {len(data)}")

print("3. Testing GET /zones/z04/state...")
with urllib.request.urlopen(f"{base}/zones/z04/state") as res:
    data = json.loads(res.read())
    print(f"   Zone 04: {data.get('name')} | Anomaly: {data.get('has_anomaly')}")

print("4. Testing GET /recommendations...")
with urllib.request.urlopen(f"{base}/recommendations") as res:
    recs = json.loads(res.read())
    print(f"   Recommendations found: {len(recs)}")
    target_rec = recs[0]
    rec_id = target_rec.get("recommendation_id") or target_rec.get("id")
    print(f"   Target Rec ID: {rec_id} | Title: {target_rec.get('title') or target_rec.get('action_name')}")

print(f"5. Testing POST /actions/{rec_id}/approve...")
# Reset first to make sure rec is pending
req_reset = urllib.request.Request(f"{base}/sim/reset", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
urllib.request.urlopen(req_reset)

# Re-fetch rec_id after reset
with urllib.request.urlopen(f"{base}/recommendations") as res:
    recs = json.loads(res.read())
    target_rec = recs[0]
    rec_id = target_rec.get("recommendation_id") or target_rec.get("id")

req = urllib.request.Request(
    f"{base}/actions/{rec_id}/approve",
    data=b"{}",
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as res:
    approval = json.loads(res.read())
    print(f"   Approval Status: {approval['status']}")
    print(f"   Before Power: {approval['before_telemetry']['total_power_kw']} kW")
    print(f"   After Power: {approval['after_telemetry']['total_power_kw']} kW")
    ver = approval.get("verification", {})
    print(f"   Verification Keys: {list(ver.keys())}")
    print(f"   Delta kW: {ver.get('delta_kw')} kW")
    print(f"   Comfort Preserved: {ver.get('comfort_preserved')}")

print("6. Testing GET /impact...")
with urllib.request.urlopen(f"{base}/impact") as res:
    impact = json.loads(res.read())
    print(f"   Gross Power: {impact['gross_building_power_kw']} kW")
    print(f"   Avoided Energy Today: {impact['total_avoided_energy_kwh']} kWh")
    print(f"   Total INR Saved: INR {impact['total_cost_savings_inr']}")
    print(f"   Verification Records in Ledger: {len(impact['verification_records'])}")

print("7. Testing POST /sim/peak-event...")
payload = json.dumps({"target_limit_kw": 60.0, "duration_minutes": 120, "scenario_id": "summer_peak"}).encode()
req = urllib.request.Request(
    f"{base}/sim/peak-event",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as res:
    peak = json.loads(res.read())
    print(f"   Peak Event Status: {peak['status']} | Reduction: {peak['peak_reduction_kw']} kW")

print("8. Testing GET /sim/peak-event...")
with urllib.request.urlopen(f"{base}/sim/peak-event") as res:
    peak_get = json.loads(res.read())
    print(f"   Peak Status Query: {peak_get['status']}")

print("9. Testing POST /sim/peak-event/stop...")
req = urllib.request.Request(
    f"{base}/sim/peak-event/stop",
    data=b"{}",
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as res:
    stopped = json.loads(res.read())
    print(f"   Peak Event Stopped Status: {stopped['status']}")

print("\nALL REAL BACKEND ENDPOINTS VERIFIED END-TO-END SUCCESSFULLY!")

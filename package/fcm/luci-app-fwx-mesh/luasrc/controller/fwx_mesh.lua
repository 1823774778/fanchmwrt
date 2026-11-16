module("luci.controller.fwx_mesh", package.seeall)

function index()
	entry({"admin", "mesh_api", "summary"}, call("mesh_summary")).leaf = true
	entry({"admin", "mesh_api", "nodes"}, call("mesh_nodes")).leaf = true
end

local function collect()
	local utl = require "luci.util"

	local st = utl.ubus("wifiroam", "status") or {}
	local topo = utl.ubus("wifiroam", "topology") or {}

	local aps, clients = {}, {}
	local nodes = topo.nodes or {}

	for _, n in ipairs(nodes) do
		if n.type == "ap" then
			aps[#aps + 1] = {
				name    = n.name,
				mac     = n.mac,
				ip      = n.ip,
				role    = n.role,
				model   = n.model,
				online  = n.online and true or false,
				clients = (type(n.clients) == "table") and #n.clients or 0
			}
		elseif n.type == "client" then
			local conn = n.conn or {}
			clients[#clients + 1] = {
				mac      = n.mac,
				name     = n.name,
				hostname = n.hostname,
				ip       = n.ip,
				parent   = n.parent,
				rssi     = conn.rssi,
				band     = conn.band,
				ssid     = conn.ssid,
				ty       = conn.type,
				rx_speed = conn.rx_speed,
				tx_speed = conn.tx_speed,
				blocked  = n.blocked and true or false
			}
		end
	end

	return {
		ok            = (st.role ~= nil) and true or false,
		role          = st.role or "unavailable",
		name          = st.name,
		ip            = st.ip,
		mac           = st.mac,
		model         = st.model,
		firmware      = st.firmware,
		version       = st.version,
		uptime        = st.uptime,
		peers_online  = st.peers_online or 0,
		peers_total   = st.peers_total or 0,
		clients_total = st.clients_total or 0,
		cap_ip        = st.cap_ip,
		kvr           = st.kvr,
		roam          = st.roam,
		backhaul      = st.backhaul,
		aps           = aps,
		clients       = clients,
		ts            = os.time()
	}
end

function mesh_summary()
	luci.http.prepare_content("application/json")
	luci.http.write_json(collect())
end

function mesh_nodes()
	luci.http.prepare_content("application/json")
	local d = collect()
	luci.http.write_json({ aps = d.aps, clients = d.clients, role = d.role })
end

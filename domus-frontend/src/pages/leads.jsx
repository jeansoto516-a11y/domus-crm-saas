import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Leads() {

    const [leads, setLeads] = useState([]);

    const navigate = useNavigate();

    const [startDate, setStartDate] = useState("");

    const [endDate, setEndDate] = useState("");

    // COR DA TEMPERATURA
    const getTemperatureColor = (temperature) => {

        const normalized = (temperature || "")
            .toString()
            .trim()
            .toLowerCase();

        switch (normalized) {

            case "quente":
                return "#ff4d4f";

            case "morno":
                return "#faad14";

            case "frio":
                return "#52c41a";

            default:
                return "#999";
        }
    };

    // BUSCAR LEADS
    const fetchLeads = async () => {

        try {

            const response = await api.get("/leads");

            console.log(
                "LEADS API:",
                response.data
            );

            let data = response.data;

            // FILTRO POR DATA
            if (startDate || endDate) {

                data = data.filter((lead) => {

                    const leadDate = new Date(
                        lead.created_at
                    )
                        .toISOString()
                        .split("T")[0];

                    if (startDate && !endDate) {

                        return (
                            leadDate >= startDate
                        );
                    }

                    if (!startDate && endDate) {

                        return (
                            leadDate <= endDate
                        );
                    }

                    if (startDate && endDate) {

                        return (
                            leadDate >= startDate &&
                            leadDate <= endDate
                        );
                    }

                    return true;
                });
            }

            setLeads(data);

        } catch (error) {

            console.log(
                "Erro ao buscar leads:",
                error
            );

            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                navigate("/login");
            }
        }
    };

    // ALTERAR STATUS
    const handleChangeStatus = async (
        id,
        currentStatus,
        direction
    ) => {

        const flow = [
            "novo",
            "contato",
            "visita",
            "proposta",
            "fechado"
        ];

        const normalizedStatus = (
            currentStatus || ""
        )
            .toString()
            .trim()
            .toLowerCase();

        let currentIndex =
            flow.indexOf(normalizedStatus);

        if (currentIndex === -1) {

            currentIndex = 0;
        }

        let newIndex = currentIndex;

        if (direction === "next") {

            newIndex++;
        }

        if (direction === "prev") {

            newIndex--;
        }

        if (
            newIndex < 0 ||
            newIndex >= flow.length
        ) {
            return;
        }

        const nextStatus =
            flow[newIndex];

        try {

            await api.put(
                `/leads/${id}`,
                {
                    status: nextStatus,
                }
            );

            // RECARREGA LEADS
            fetchLeads();

        } catch (error) {

            console.log(
                "Erro ao atualizar lead:",
                error.response?.data || error
            );
        }
    };

    useEffect(() => {

        fetchLeads();

    }, [startDate, endDate]);

    return (

        <div
            style={{
                padding: "20px",
            }}
        >

            {/* VOLTAR */}
            <button
                onClick={() =>
                    navigate("/dashboard")
                }
                style={{
                    marginBottom: "20px",
                    padding: "8px 12px",
                    backgroundColor: "#555",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                }}
            >
                ⬅ Voltar para Dashboard
            </button>

            <h1>Leads</h1>

            {/* FILTROS */}
            <div
                style={{
                    marginBottom: "20px",
                    display: "flex",
                    gap: "10px",
                }}
            >

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                        setStartDate(
                            e.target.value
                        )
                    }
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                        setEndDate(
                            e.target.value
                        )
                    }
                />

                <button
                    onClick={() => {

                        setStartDate("");

                        setEndDate("");
                    }}
                >
                    Limpar
                </button>

            </div>

            {/* TABELA */}
            <table
                border="1"
                cellPadding="10"
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                }}
            >

                <thead>

                    <tr>

                        <th>Nome</th>

                        <th>Email</th>

                        <th>Status</th>

                        <th>Score</th>

                        <th>Temperatura</th>

                        <th>Ações</th>

                    </tr>

                </thead>

                <tbody>

                    {leads.map((lead) => (

                        <tr key={lead.id}>

                            <td>
                                {lead.name}
                            </td>

                            <td>
                                {lead.email}
                            </td>

                            <td>
                                {lead.status}
                            </td>

                            {/* SCORE */}
                            <td>

                                <strong>

                                    {lead.score ?? 0}

                                </strong>

                            </td>

                            {/* TEMPERATURA */}
                            <td>

                                <span
                                    style={{
                                        backgroundColor:
                                            getTemperatureColor(
                                                lead.temperature
                                            ),
                                        color: "#fff",
                                        padding:
                                            "5px 10px",
                                        borderRadius:
                                            "20px",
                                        fontWeight:
                                            "bold",
                                        display:
                                            "inline-block",
                                        minWidth:
                                            "80px",
                                        textAlign:
                                            "center",
                                    }}
                                >

                                    {(
                                        lead.temperature ||
                                        "frio"
                                    )
                                        .toString()
                                        .trim()}

                                </span>

                            </td>

                            {/* AÇÕES */}
                            <td>

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap: "8px",
                                    }}
                                >

                                    <button
                                        onClick={() =>
                                            handleChangeStatus(
                                                lead.id,
                                                lead.status,
                                                "prev"
                                            )
                                        }
                                    >
                                        Voltar
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleChangeStatus(
                                                lead.id,
                                                lead.status,
                                                "next"
                                            )
                                        }
                                    >
                                        Avançar
                                    </button>

                                </div>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}

export default Leads;
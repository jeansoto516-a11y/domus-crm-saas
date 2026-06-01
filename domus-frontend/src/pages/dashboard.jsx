import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {

    const [data, setData] = useState(null);

    // FILTRO DE DATA
    const [startDate, setStartDate] = useState("");

    const [endDate, setEndDate] = useState("");

    const navigate = useNavigate();

    useEffect(() => {

        const fetchDashboard = async () => {

            try {

                const response = await api.get(
                    "/leads/dashboard",
                    {
                        params: {
                            startDate,
                            endDate,
                        },
                    }
                );

                console.log(
                    "DASHBOARD:",
                    response.data
                );

                setData(response.data);

            } catch (error) {

                console.log(
                    "ERRO DASHBOARD:",
                    error
                );

                console.log(
                    "STATUS:",
                    error.response?.status
                );

                console.log(
                    "DATA:",
                    error.response?.data
                );

                // ⚠ NÃO REDIRECIONA AUTOMATICAMENTE
                // para conseguirmos ver o erro real
            }
        };

        const token =
            localStorage.getItem("token");

        console.log("TOKEN:", token);

        if (token) {

            fetchDashboard();

        } else {

            console.log(
                "TOKEN NÃO ENCONTRADO"
            );

            navigate("/login");
        }

    }, [navigate, startDate, endDate]);

    // LOADING
    if (!data) {

        return (

            <div
                style={{
                    padding: "40px",
                    textAlign: "center",
                }}
            >

                <h2>
                    Carregando dashboard...
                </h2>

                <p>
                    Abra o console (F12)
                    para verificar o erro.
                </p>

            </div>
        );
    }

    return (

        <div
            style={{
                padding: "40px",
                textAlign: "center",
            }}
        >

            <h1>Dashboard 🚀</h1>

            {/* FILTRO DE DATA */}
            <div
                style={{
                    marginBottom: "20px",
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
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

            {/* TOTAL */}
            <h2>
                Total de Leads:
                {" "}
                {data.total}
            </h2>

            {/* STATUS */}
            <h3>Por Status:</h3>

            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                }}
            >

                <li>
                    Novo:
                    {" "}
                    {data.por_status?.novo || 0}
                </li>

                <li>
                    Contato:
                    {" "}
                    {data.por_status?.contato || 0}
                </li>

                <li>
                    Visita:
                    {" "}
                    {data.por_status?.visita || 0}
                </li>

                <li>
                    Proposta:
                    {" "}
                    {data.por_status?.proposta || 0}
                </li>

                <li>
                    Fechado:
                    {" "}
                    {data.por_status?.fechado || 0}
                </li>

            </ul>

            {/* CONVERSÃO */}
            <h3>Conversão:</h3>

            <p>
                {data.conversao}
            </p>

            <br />

            {/* BOTÕES */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                }}
            >

                <button
                    onClick={() =>
                        navigate("/leads/novo")
                    }
                    style={{
                        padding: "10px",
                        backgroundColor: "#4CAF50",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}
                >
                    ➕ Criar Lead
                </button>

                <button
                    onClick={() =>
                        navigate("/leads")
                    }
                    style={{
                        padding: "10px",
                        backgroundColor: "#2196F3",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}
                >
                    📊 Ver Leads
                </button>

            </div>

        </div>
    );
}

export default Dashboard;
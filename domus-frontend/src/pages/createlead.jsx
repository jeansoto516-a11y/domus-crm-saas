import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CreateLead() {

    const [name, setName] = useState("");

    const [email, setEmail] = useState("");

    const [phone, setPhone] = useState("");

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleCreate = async (e) => {

        e.preventDefault();

        // VALIDAÇÃO
        if (!name || !email || !phone) {

            alert("Preencha todos os campos");

            return;
        }

        try {

            setLoading(true);

            const response = await api.post(
                "/leads",
                {
                    name,
                    email,
                    phone,
                }
            );

            console.log(
                "LEAD CRIADO:",
                response.data
            );

            alert(
                "Lead criado com sucesso 🚀"
            );

            // LIMPA CAMPOS
            setName("");

            setEmail("");

            setPhone("");

            // REDIRECIONA
            navigate("/dashboard");

        } catch (error) {

            console.log(
                "ERRO CREATE LEAD:",
                error
            );

            if (
                error.response?.status === 401
            ) {

                alert(
                    "Sessão expirada. Faça login novamente."
                );

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                navigate("/login");

            } else {

                alert(
                    "Erro ao criar lead"
                );
            }

        } finally {

            setLoading(false);
        }
    };

    return (

        <div
            style={{
                padding: "40px",
                maxWidth: "500px",
                margin: "0 auto",
            }}
        >

            <h1>Novo Lead</h1>

            <form onSubmit={handleCreate}>

                {/* NOME */}
                <input
                    type="text"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: "10px",
                    }}
                />

                <br />
                <br />

                {/* EMAIL */}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: "10px",
                    }}
                />

                <br />
                <br />

                {/* TELEFONE */}
                <input
                    type="text"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) =>
                        setPhone(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: "10px",
                    }}
                />

                <br />
                <br />

                {/* BOTÕES */}
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                    }}
                >

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "10px 15px",
                            backgroundColor:
                                "#4CAF50",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        {loading
                            ? "Criando..."
                            : "Criar Lead"}
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        style={{
                            padding: "10px 15px",
                            backgroundColor:
                                "#555",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        Voltar
                    </button>

                </div>

            </form>

        </div>
    );
}

export default CreateLead;
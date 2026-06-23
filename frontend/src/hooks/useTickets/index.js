import { useState, useEffect } from "react";
import { getHoursCloseTicketsAuto } from "../../config";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const useTickets = ({
    searchParam,
    pageNumber,
    status,
    date,
    showAll,
    queueIds,
    ecosystemId,
    withUnreadMessages,
}) => {
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchTickets = async() => {
                try {
                    const { data } = await api.get("/tickets", {
                        params: {
                            searchParam,
                            pageNumber,
                            status,
                            date,
                            showAll,
                            queueIds,
                            ecosystemId,
                            withUnreadMessages,
                        },
                    })
                    if (!isMounted) return;
                    if (localStorage.getItem("DEBUG_TICKETS") === "true") {
                        console.debug("[tickets] api:list", {
                            status,
                            searchParam: Boolean(searchParam),
                            pageNumber,
                            showAll,
                            queueIds,
                            ecosystemId,
                            count: data.count,
                            returned: data.tickets.map(ticket => ({
                                id: ticket.id,
                                status: ticket.status,
                                userId: ticket.userId,
                                queueId: ticket.queueId,
                                ecosystemId: ticket.ecosystemId,
                            })),
                        })
                    }
                    setTickets(data.tickets)

                    let horasFecharAutomaticamente = getHoursCloseTicketsAuto(); 

                    if (status === "open" && horasFecharAutomaticamente && horasFecharAutomaticamente !== "" &&
                        horasFecharAutomaticamente !== "0" && Number(horasFecharAutomaticamente) > 0) {

                        let dataLimite = new Date()
                        dataLimite.setHours(dataLimite.getHours() - Number(horasFecharAutomaticamente))

                        data.tickets.forEach(ticket => {
                            if (ticket.status !== "closed") {
                                let dataUltimaInteracaoChamado = new Date(ticket.updatedAt)
                                if (dataUltimaInteracaoChamado < dataLimite)
                                    closeTicket(ticket)
                            }
                        })
                    }

                    setHasMore(data.hasMore)
                    setCount(data.count)
                    setLoading(false)
                } catch (err) {
                    if (!isMounted) return;
                    setLoading(false)
                    toastError(err)
                }
            }

            const closeTicket = async(ticket) => {
                await api.put(`/tickets/${ticket.id}`, {
                    status: "closed",
                    userId: ticket.userId || null,
                })
            }

            fetchTickets()
        }, 500)
        return () => {
            isMounted = false;
            clearTimeout(delayDebounceFn)
        }
    }, [
        searchParam,
        pageNumber,
        status,
        date,
        showAll,
        queueIds,
        ecosystemId,
        withUnreadMessages,
    ])

    return { tickets, loading, hasMore, count };
};

export default useTickets;

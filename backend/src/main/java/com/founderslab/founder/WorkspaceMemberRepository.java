package com.founderslab.founder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, WorkspaceMemberId> {

    Optional<WorkspaceMember> findFirstByIdFounderId(UUID founderId);
}
